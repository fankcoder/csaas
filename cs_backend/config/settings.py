from pathlib import Path
import importlib.util
import os
from urllib.parse import urlparse

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"


def load_plain_env(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        os.environ.setdefault(key, value)


if load_dotenv:
    load_dotenv(ENV_FILE)
else:
    load_plain_env(ENV_FILE)


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-change-me")
DEBUG = env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "django_filters",
    "corsheaders",
    "authuser",
    "price",
    "siteconfig",
    "pay",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

database_url = os.getenv("DATABASE_URL", "")
parsed_database_url = urlparse(database_url) if database_url else None

if os.getenv("MYSQL_HOST") or (parsed_database_url and parsed_database_url.scheme.startswith("mysql")):
    mysql_host = os.getenv("MYSQL_HOST")
    mysql_port = os.getenv("MYSQL_PORT")
    mysql_name = os.getenv("MYSQL_DATABASE")
    mysql_user = os.getenv("MYSQL_USER")
    mysql_password = os.getenv("MYSQL_PASSWORD")

    if parsed_database_url and parsed_database_url.scheme.startswith("mysql"):
        mysql_host = mysql_host or parsed_database_url.hostname
        mysql_port = mysql_port or str(parsed_database_url.port or 3306)
        mysql_name = mysql_name or parsed_database_url.path.lstrip("/")
        mysql_user = mysql_user or parsed_database_url.username
        mysql_password = mysql_password or parsed_database_url.password

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "HOST": mysql_host or "127.0.0.1",
            "PORT": mysql_port or "3306",
            "NAME": mysql_name or "csaas",
            "USER": mysql_user or "root",
            "PASSWORD": mysql_password or "",
            "OPTIONS": {"charset": "utf8mb4"},
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "zh-hans"
TIME_ZONE = "Asia/Shanghai"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = env_list(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 30,
}

redis_url = os.getenv("REDIS_URL", "")
redis_available = importlib.util.find_spec("django_redis") is not None
if redis_url.startswith(("redis://", "rediss://")) and redis_available:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": redis_url,
            "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        }
    }
else:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

USD_CNY_RATE = os.getenv("USD_CNY_RATE", "7.25")
MARKET_SELL_FEES = {
    "buff": os.getenv("BUFF_SELL_FEE", "0.025"),
    "waxpeer": os.getenv("WAXPEER_SELL_FEE", "0.07"),
    "shadowpay": os.getenv("SHADOWPAY_SELL_FEE", "0.05"),
}
