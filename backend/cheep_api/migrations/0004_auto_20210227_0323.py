# Generated by Django 3.1.6 on 2021-02-27 03:23

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cheep_api', '0003_auto_20210227_0319'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Tags',
            new_name='Tag',
        ),
    ]
