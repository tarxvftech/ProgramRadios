# Generated by Django 3.1.7 on 2021-12-01 06:12

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cheep_api', '0007_firmware_sha256hash'),
    ]

    operations = [
        migrations.RenameField(
            model_name='firmware',
            old_name='orig_filename',
            new_name='filename',
        ),
        migrations.RemoveField(
            model_name='firmware',
            name='for_radios',
        ),
    ]
