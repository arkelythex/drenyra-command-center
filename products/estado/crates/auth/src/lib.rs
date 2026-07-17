use jsonwebtoken::{
    decode, decode_header,
    jwk::{AlgorithmParameters, JwkSet},
    Algorithm, DecodingKey, Validation,
};
use serde::Deserialize;
use std::{
    collections::{HashMap, HashSet},
    env,
    sync::Arc,
    time::{Duration, Instant},
};
use thiserror::Error;
use tokio::sync::RwLock;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Role {
    Admin,
    Moderator,
}

impl Role {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Admin => "ADMIN",
            Self::Moderator => "MODERATOR",
        }
    }
}

#[derive(Debug, Clone)]
pub struct Principal {
    pub subject: String,
    pub roles: HashSet<Role>,
}

#[derive(Debug, Clone, Copy)]
pub enum AuthMode {
    Disabled,
    DevStatic,
    OidcJwks,
}

impl AuthMode {
    fn from_env(value: &str) -> Self {
        match value {
            "disabled" => Self::Disabled,
            "oidc" => Self::OidcJwks,
            _ => Self::DevStatic,
        }
    }
}

#[derive(Debug, Clone)]
pub struct AuthConfig {
    pub mode: AuthMode,
    pub oidc_issuer: Option<String>,
    pub oidc_audience: Option<String>,
    pub oidc_jwks_url: Option<String>,
    pub oidc_client_id: Option<String>,
    pub dev_admin_token: String,
    pub dev_moderator_token: String,
    pub jwks_cache_ttl: Duration,
}

impl AuthConfig {
    pub fn from_env() -> Self {
        let mode =
            AuthMode::from_env(&env::var("AUTH_MODE").unwrap_or_else(|_| "dev_static".to_string()));
        let cache_ttl_seconds = env::var("AUTH_JWKS_CACHE_TTL_SECONDS")
            .ok()
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(300);

        Self {
            mode,
            oidc_issuer: env::var("OIDC_ISSUER_URL").ok(),
            oidc_audience: env::var("OIDC_AUDIENCE").ok(),
            oidc_jwks_url: env::var("OIDC_JWKS_URL").ok(),
            oidc_client_id: env::var("OIDC_CLIENT_ID").ok(),
            dev_admin_token: env::var("DEV_ADMIN_TOKEN")
                .unwrap_or_else(|_| "dev-admin-token".to_string()),
            dev_moderator_token: env::var("DEV_MODERATOR_TOKEN")
                .unwrap_or_else(|_| "dev-moderator-token".to_string()),
            jwks_cache_ttl: Duration::from_secs(cache_ttl_seconds),
        }
    }
}

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("missing bearer token")]
    MissingToken,
    #[error("invalid bearer token format")]
    InvalidTokenFormat,
    #[error("unauthorized token")]
    Unauthorized,
    #[error("forbidden")]
    Forbidden,
    #[error("oidc config missing: {0}")]
    MissingOidcConfig(&'static str),
    #[error("jwks fetch failed: {0}")]
    JwksFetch(String),
    #[error("jwt decode error: {0}")]
    JwtDecode(String),
}

#[derive(Clone)]
pub struct AuthService {
    config: AuthConfig,
    client: reqwest::Client,
    cache: Arc<RwLock<Option<JwksCache>>>,
}

#[derive(Clone)]
struct JwksCache {
    fetched_at: Instant,
    jwks: JwkSet,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct OidcClaims {
    sub: String,
    iss: Option<String>,
    aud: Option<serde_json::Value>,
    exp: Option<u64>,
    roles: Option<Vec<String>>,
    realm_access: Option<RealmAccess>,
    resource_access: Option<HashMap<String, ResourceAccess>>,
}

#[derive(Debug, Deserialize)]
struct RealmAccess {
    roles: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct ResourceAccess {
    roles: Option<Vec<String>>,
}

impl AuthService {
    pub fn from_env() -> Self {
        Self {
            config: AuthConfig::from_env(),
            client: reqwest::Client::new(),
            cache: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn authenticate_bearer(
        &self,
        auth_header: Option<&str>,
    ) -> Result<Principal, AuthError> {
        match self.config.mode {
            AuthMode::Disabled => Ok(Principal {
                subject: "anonymous".to_string(),
                roles: HashSet::from([Role::Admin, Role::Moderator]),
            }),
            AuthMode::DevStatic => self.authenticate_dev(auth_header),
            AuthMode::OidcJwks => self.authenticate_oidc(auth_header).await,
        }
    }

    pub fn require_any_role(&self, principal: &Principal, roles: &[Role]) -> Result<(), AuthError> {
        if roles.iter().any(|role| principal.roles.contains(role)) {
            return Ok(());
        }
        Err(AuthError::Forbidden)
    }

    fn authenticate_dev(&self, auth_header: Option<&str>) -> Result<Principal, AuthError> {
        let token = parse_bearer(auth_header)?;

        if token == self.config.dev_admin_token {
            return Ok(Principal {
                subject: "dev-admin".to_string(),
                roles: HashSet::from([Role::Admin, Role::Moderator]),
            });
        }

        if token == self.config.dev_moderator_token {
            return Ok(Principal {
                subject: "dev-moderator".to_string(),
                roles: HashSet::from([Role::Moderator]),
            });
        }

        Err(AuthError::Unauthorized)
    }

    async fn authenticate_oidc(&self, auth_header: Option<&str>) -> Result<Principal, AuthError> {
        let token = parse_bearer(auth_header)?;
        let header = decode_header(token).map_err(|e| AuthError::JwtDecode(e.to_string()))?;
        let kid = header.kid.ok_or(AuthError::Unauthorized)?;

        let jwks = self.fetch_jwks().await?;
        let jwk = jwks
            .keys
            .iter()
            .find(|k| k.common.key_id.as_deref() == Some(kid.as_str()))
            .ok_or(AuthError::Unauthorized)?;

        let (n, e) = match &jwk.algorithm {
            AlgorithmParameters::RSA(rsa) => (rsa.n.clone(), rsa.e.clone()),
            _ => return Err(AuthError::Unauthorized),
        };

        let mut validation = Validation::new(Algorithm::RS256);
        if let Some(audience) = &self.config.oidc_audience {
            validation.set_audience(&[audience]);
        }
        if let Some(issuer) = &self.config.oidc_issuer {
            validation.set_issuer(&[issuer]);
        }

        let decoding_key = DecodingKey::from_rsa_components(&n, &e)
            .map_err(|e| AuthError::JwtDecode(e.to_string()))?;
        let token_data = decode::<OidcClaims>(token, &decoding_key, &validation)
            .map_err(|e| AuthError::JwtDecode(e.to_string()))?;

        let claims = token_data.claims;
        if claims.sub.trim().is_empty() {
            return Err(AuthError::Unauthorized);
        }

        let roles = extract_roles(&claims, self.config.oidc_client_id.as_deref());

        Ok(Principal {
            subject: claims.sub,
            roles,
        })
    }

    async fn fetch_jwks(&self) -> Result<JwkSet, AuthError> {
        {
            let cache = self.cache.read().await;
            if let Some(cache) = cache.as_ref() {
                if cache.fetched_at.elapsed() < self.config.jwks_cache_ttl {
                    return Ok(cache.jwks.clone());
                }
            }
        }

        let jwks_url = self
            .config
            .oidc_jwks_url
            .as_ref()
            .ok_or(AuthError::MissingOidcConfig("OIDC_JWKS_URL"))?;

        let response = self
            .client
            .get(jwks_url)
            .send()
            .await
            .map_err(|e| AuthError::JwksFetch(e.to_string()))?;

        if !response.status().is_success() {
            return Err(AuthError::JwksFetch(format!(
                "HTTP {} from JWKS endpoint",
                response.status()
            )));
        }

        let jwks = response
            .json::<JwkSet>()
            .await
            .map_err(|e| AuthError::JwksFetch(e.to_string()))?;

        let mut cache = self.cache.write().await;
        *cache = Some(JwksCache {
            fetched_at: Instant::now(),
            jwks: jwks.clone(),
        });

        Ok(jwks)
    }
}

fn parse_bearer(auth_header: Option<&str>) -> Result<&str, AuthError> {
    let value = auth_header.ok_or(AuthError::MissingToken)?;
    let (scheme, token) = value.split_once(' ').ok_or(AuthError::InvalidTokenFormat)?;
    if !scheme.eq_ignore_ascii_case("Bearer") {
        return Err(AuthError::InvalidTokenFormat);
    }
    if token.trim().is_empty() {
        return Err(AuthError::InvalidTokenFormat);
    }
    Ok(token)
}

fn extract_roles(claims: &OidcClaims, client_id: Option<&str>) -> HashSet<Role> {
    let mut raw_roles: HashSet<String> = HashSet::new();

    if let Some(roles) = claims.roles.as_ref() {
        raw_roles.extend(roles.iter().cloned());
    }

    if let Some(realm_access) = claims.realm_access.as_ref() {
        if let Some(roles) = realm_access.roles.as_ref() {
            raw_roles.extend(roles.iter().cloned());
        }
    }

    if let (Some(client_id), Some(resource_access)) = (client_id, claims.resource_access.as_ref()) {
        if let Some(client) = resource_access.get(client_id) {
            if let Some(roles) = client.roles.as_ref() {
                raw_roles.extend(roles.iter().cloned());
            }
        }
    }

    raw_roles
        .into_iter()
        .filter_map(|role| match role.as_str() {
            "ADMIN" | "admin" | "realm-admin" => Some(Role::Admin),
            "MODERATOR" | "moderator" => Some(Role::Moderator),
            _ => None,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_bearer_accepts_valid_header() {
        let token = parse_bearer(Some("Bearer abc.def.ghi")).expect("valid bearer");
        assert_eq!(token, "abc.def.ghi");
    }

    #[test]
    fn parse_bearer_rejects_missing_header() {
        let err = parse_bearer(None).expect_err("should fail");
        assert!(matches!(err, AuthError::MissingToken));
    }

    #[test]
    fn extract_roles_maps_common_claims() {
        let claims = OidcClaims {
            sub: "user-1".to_string(),
            iss: None,
            aud: None,
            exp: None,
            roles: None,
            realm_access: Some(RealmAccess {
                roles: Some(vec!["ADMIN".to_string()]),
            }),
            resource_access: Some(HashMap::from([(
                "civictech-api".to_string(),
                ResourceAccess {
                    roles: Some(vec!["MODERATOR".to_string()]),
                },
            )])),
        };

        let roles = extract_roles(&claims, Some("civictech-api"));
        assert!(roles.contains(&Role::Admin));
        assert!(roles.contains(&Role::Moderator));
    }
}
