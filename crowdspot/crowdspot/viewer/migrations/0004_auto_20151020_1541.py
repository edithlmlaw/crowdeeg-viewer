# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('viewer', '0003_auto_20151019_1551'),
    ]

    operations = [
        migrations.CreateModel(
            name='SpindleEvaluation',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('user', models.OneToOneField(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='feature',
            name='example_score',
            field=models.SmallIntegerField(default=-1),
        ),
        migrations.AddField(
            model_name='feature',
            name='shape_score',
            field=models.SmallIntegerField(default=-1),
        ),
        migrations.AddField(
            model_name='feature',
            name='speed_score',
            field=models.SmallIntegerField(default=-1),
        ),
    ]
