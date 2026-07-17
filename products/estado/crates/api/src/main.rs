mod actor_audit;
mod api_error;
mod authz;
mod bootstrap;
mod metrics;
mod middleware;
mod routes;
mod state;

use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    civictech_observability::init();
    let state = bootstrap::build_state().await;
    let app = routes::build_router(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!(%addr, "civictech-api listening");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind listener");

    axum::serve(listener, app).await.expect("server error");
}
