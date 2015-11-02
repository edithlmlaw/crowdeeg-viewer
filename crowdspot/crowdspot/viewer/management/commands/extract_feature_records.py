import os
from django.core.management.base import BaseCommand, CommandError
from crowdspot.viewer.models import *
from pprint import pprint
import csv

class Command(BaseCommand):
    help = 'Closes the specified poll for voting'

    recording_name = 'excerpt1_50'
    users_of_interest = [
        'expert',
        'Alex2',
        'jeff',
        'will',
        'alex',
        'sarah',
        'Alex',
    ]

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        data_dir = 'spindle_data'
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)

        for username in self.users_of_interest:
            annotator = Annotator.objects.get(username=username)
            recording, created = Recording.objects.get_or_create(name=self.recording_name)
            # Django query sets use lazy evaulation, using list forces them to evaluate
            features = list(Feature.objects.filter(recording=recording, annotator=annotator))
            feature_list = [ob.as_dict() for ob in features]

            sorted_feature_list = sorted(feature_list, key=lambda k: k['start'])
            
            output_fp = os.path.join(data_dir, username + '.csv')
            with open(output_fp, 'wb') as f:                
                writer = csv.DictWriter(f, fieldnames=['feature_type', 'channel', 'start', 'end'])
                writer.writeheader()
                writer.writerows(sorted_feature_list)