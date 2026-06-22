from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Arkelythex Data Engine"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    CONTRACT_VERSION: str = "v1"

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
