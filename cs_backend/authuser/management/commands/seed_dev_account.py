import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from authuser.services import ensure_profile


class Command(BaseCommand):
    help = "Create or update a local development superuser account."

    def add_arguments(self, parser):
        parser.add_argument("--username", default=os.getenv("DEV_ADMIN_USERNAME", "devadmin"))
        parser.add_argument("--email", default=os.getenv("DEV_ADMIN_EMAIL", "devadmin@example.com"))
        parser.add_argument("--password", default=os.getenv("DEV_ADMIN_PASSWORD", "DevAdmin12345"))
        parser.add_argument("--steam-id", default=os.getenv("DEV_ADMIN_STEAM_ID", "76561198153187116"))

    def handle(self, *args, **options):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=options["username"],
            defaults={
                "email": options["email"],
                "is_staff": True,
                "is_superuser": True,
            },
        )
        user.email = options["email"]
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(options["password"])
        user.save()

        profile = ensure_profile(user)
        profile.steam_id = options["steam_id"]
        profile.save(update_fields=["steam_id", "updated_at"])

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} dev account: {user.username}"))
        self.stdout.write(f"email={user.email}")
        self.stdout.write(f"password={options['password']}")
        self.stdout.write(f"steam_id={profile.steam_id}")
