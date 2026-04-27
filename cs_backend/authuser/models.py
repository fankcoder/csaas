from django.conf import settings
from django.db import models
from django.utils import timezone


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    steam_id = models.CharField(max_length=32, blank=True, db_index=True)
    steam_persona_name = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.user.username


class EmailVerificationCode(models.Model):
    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=8)
    purpose = models.CharField(max_length=30, default="register")
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["email", "purpose", "is_used"]),
            models.Index(fields=["expires_at"]),
        ]

    def is_valid(self) -> bool:
        return not self.is_used and self.expires_at > timezone.now()


class UserPlatformChecklist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="platform_checklist")
    key = models.CharField(max_length=50)
    is_completed = models.BooleanField(default=False)
    note = models.CharField(max_length=255, blank=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("user", "key"), name="uniq_user_platform_checklist_key")
        ]
        indexes = [
            models.Index(fields=["user", "is_completed"]),
            models.Index(fields=["key"]),
        ]

    def save(self, *args, **kwargs):
        if self.is_completed and self.completed_at is None:
            self.completed_at = timezone.now()
        if not self.is_completed:
            self.completed_at = None
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.user_id}:{self.key}"
