from __future__ import annotations

import os
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]


def setup_django() -> None:
    if str(BASE_DIR) not in sys.path:
        sys.path.insert(0, str(BASE_DIR))

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    import django
    from django.apps import apps

    if not apps.ready:
        django.setup()
