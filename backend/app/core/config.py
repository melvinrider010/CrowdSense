import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class Settings(BaseModel):
    DATABASE_URL: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL", "postgresql://postgres:Melu@localhost:5432/crowdsense"
        )
    )
    ENV: str = Field(default_factory=lambda: os.getenv("ENV", "development"))
    LOG_LEVEL: str = Field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    DEVICE_API_KEY: str = Field(
        default_factory=lambda: os.getenv(
            "DEVICE_API_KEY", "crowdsense-device-secret-key-123"
        )
    )

settings = Settings()
