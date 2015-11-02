# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('viewer', '0004_auto_20151020_1541'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='spindleevaluation',
            name='user',
        ),
        migrations.RemoveField(
            model_name='feature',
            name='example_score',
        ),
        migrations.RemoveField(
            model_name='feature',
            name='shape_score',
        ),
        migrations.RemoveField(
            model_name='feature',
            name='speed_score',
        ),
        migrations.DeleteModel(
            name='SpindleEvaluation',
        ),
    ]
