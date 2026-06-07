from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "TradeLink V1"
    ENV: str = "dev"

    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str
    CORS_ORIGINS: str = "http://localhost:5173"

    SEED_ADMIN_EMAIL: str = "admin@tradelink.local"
    SEED_ADMIN_PASSWORD: str = "Admin@12345"

    def cors_list(self) -> List[str]:
        return [x.strip() for x in self.CORS_ORIGINS.split(",") if x.strip()]

settings = Settings()
