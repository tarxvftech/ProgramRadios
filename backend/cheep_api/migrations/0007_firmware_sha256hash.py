# Generated by Django 3.1.7 on 2021-02-28 05:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cheep_api', '0006_auto_20210227_0345'),
    ]

    operations = [
        migrations.AddField(
            model_name='firmware',
            name='sha256hash',
            field=models.CharField(max_length=64, null=True, unique=True),
        ),
    ]
