from django.db import models


class ActiveQuerySet(models.QuerySet):
    def delete(self):
        self.update(is_active=False)

    def hard_delete(self):
        super().delete()


class ActiveManager(models.Manager):
    def get_queryset(self):
        return ActiveQuerySet(self.model, using=self._db).filter(is_active=True)


class AllObjectsManager(models.Manager):
    def get_queryset(self):
        return ActiveQuerySet(self.model, using=self._db)
