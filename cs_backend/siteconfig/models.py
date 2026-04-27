from django.db import models


class SiteSetting(models.Model):
    key = models.CharField(max_length=80, unique=True)
    value = models.JSONField(default=dict, blank=True)
    description = models.CharField(max_length=255, blank=True)
    is_public = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("key",)

    def __str__(self) -> str:
        return self.key
