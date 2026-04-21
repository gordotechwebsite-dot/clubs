from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:////data/titanes.db"
    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    admin_email: str = "admin@clubtitanes.com"
    admin_password: str = "titanes2026"
    admin_name: str = "Admin"

    monthly_fee: int = 50000  # COP
    club_name: str = "Club Titanes Soatá"

    cors_origins: str = "*"


settings = Settings()
