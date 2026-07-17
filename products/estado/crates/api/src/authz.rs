use axum::http::HeaderMap;
use civictech_auth::{AuthError, Principal, Role};

use crate::{api_error::ApiError, state::AppState};

pub async fn authenticate(state: &AppState, headers: &HeaderMap) -> Result<Principal, ApiError> {
    let auth_header = headers
        .get("authorization")
        .and_then(|value| value.to_str().ok());

    match state.auth.authenticate_bearer(auth_header).await {
        Ok(principal) => {
            state
                .metrics
                .observe_auth_decision("authenticated", "bearer");
            Ok(principal)
        }
        Err(error) => {
            let decision = match &error {
                AuthError::MissingToken
                | AuthError::InvalidTokenFormat
                | AuthError::Unauthorized => "unauthorized",
                AuthError::Forbidden => "forbidden",
                AuthError::MissingOidcConfig(_)
                | AuthError::JwksFetch(_)
                | AuthError::JwtDecode(_) => "auth_error",
            };
            state.metrics.observe_auth_decision(decision, "bearer");
            Err(map_auth_error(error))
        }
    }
}

pub fn authorize(
    state: &AppState,
    principal: &Principal,
    roles: &[Role],
    endpoint: &str,
) -> Result<(), ApiError> {
    match state.auth.require_any_role(principal, roles) {
        Ok(()) => {
            state.metrics.observe_auth_decision("authorized", endpoint);
            Ok(())
        }
        Err(_) => {
            state.metrics.observe_auth_decision("forbidden", endpoint);
            Err(ApiError::forbidden("insufficient role"))
        }
    }
}

pub(crate) fn map_auth_error(error: AuthError) -> ApiError {
    match error {
        AuthError::MissingToken | AuthError::InvalidTokenFormat | AuthError::Unauthorized => {
            ApiError::unauthorized(error.to_string())
        }
        AuthError::Forbidden => ApiError::forbidden(error.to_string()),
        AuthError::MissingOidcConfig(_) | AuthError::JwksFetch(_) | AuthError::JwtDecode(_) => {
            ApiError::internal(error.to_string())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;

    #[test]
    fn map_auth_error_sets_unauthorized_for_missing_token() {
        let api_error = map_auth_error(AuthError::MissingToken);
        assert_eq!(api_error.code, StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn map_auth_error_sets_forbidden_for_role_denial() {
        let api_error = map_auth_error(AuthError::Forbidden);
        assert_eq!(api_error.code, StatusCode::FORBIDDEN);
    }
}
