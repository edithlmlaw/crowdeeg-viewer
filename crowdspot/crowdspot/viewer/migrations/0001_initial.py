# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Annotator',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('username', models.CharField(max_length=255)),
                ('category', models.CharField(max_length=255)),
                ('score', models.IntegerField(default=0)),
                ('current_page', models.PositiveIntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='Feature',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('feature_type', models.CharField(max_length=255)),
                ('start', models.DecimalField(max_digits=10, decimal_places=2)),
                ('end', models.DecimalField(max_digits=10, decimal_places=2)),
                ('channel', models.CharField(max_length=255)),
                ('certainty', models.DecimalField(max_digits=10, decimal_places=9)),
                ('annotator', models.ForeignKey(to='viewer.Annotator')),
            ],
        ),
        migrations.CreateModel(
            name='Recording',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=255)),
            ],
        ),
        migrations.AddField(
            model_name='feature',
            name='recording',
            field=models.ForeignKey(to='viewer.Recording'),
        ),
    ]
