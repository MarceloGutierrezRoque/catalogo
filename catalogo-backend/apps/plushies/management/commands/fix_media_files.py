import os
import re
from django.conf import settings
from django.core.management.base import BaseCommand
from apps.plushies.models import Plushie


class Command(BaseCommand):
    help = "Fix plushie image paths to match files on disk"

    def handle(self, *args, **options):
        media_root = settings.MEDIA_ROOT
        fixed = 0
        not_found = 0

        for plushie in Plushie.objects.exclude(image__exact=""):
            old_path = plushie.image.name
            if not old_path:
                continue

            full_path = os.path.join(media_root, old_path)
            if os.path.exists(full_path):
                self.stdout.write(f"  OK  {old_path}")
                continue

            dirname = os.path.dirname(old_path)
            basename = os.path.basename(old_path)
            base, ext = os.path.splitext(basename)
            clean = re.sub(r"_[A-Za-z0-9]{7}$", "", base)
            clean_name = f"{clean}{ext}"
            clean_path = os.path.join(dirname, clean_name).replace("\\", "/")
            clean_full = os.path.join(media_root, clean_path)

            if os.path.exists(clean_full):
                plushie.image.name = clean_path
                plushie.save(update_fields=["image"])
                self.stdout.write(self.style.SUCCESS(f"  FIX  {old_path} -> {clean_path}"))
                fixed += 1
            else:
                self.stdout.write(self.style.WARNING(f"  MISS {old_path} (not found on disk)"))
                not_found += 1

        self.stdout.write(self.style.SUCCESS(f"\nDone. Fixed: {fixed}, Missing: {not_found}"))
