# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('viewer', '0002_turker'),
    ]

    operations = [
        migrations.RenameField(
            model_name='turker',
            old_name='task_class',
            new_name='task_type',
        ),
    ]
