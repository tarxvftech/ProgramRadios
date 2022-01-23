from django.contrib import admin

# Register your models here.

from . import models

admin.site.register(models.Codeplug)
admin.site.register(models.Firmware)
admin.site.register(models.RadioModel)
admin.site.register(models.RadioManufacturer)
admin.site.register(models.Tag)
