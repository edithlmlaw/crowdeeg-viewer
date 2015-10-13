from django.db import models

# the model needs to be changed to store classification (there are 5 classes: N1,N2,N3,REM,Awake) in a separate
# table from the feature annotations (e.g., sleep spindle, K-complexes)
# you would also need to change views.py to save classification and annotations accordingly

class Annotator(models.Model):
    """Basic information about the person doing the annotations"""
    username = models.CharField(max_length=255)
    category = models.CharField(max_length=255) # Ex. Neurologist, mechanical turker
    score = models.IntegerField(default=0)
    current_page_start = models.PositiveIntegerField(default=0) # pages start with int number of seconds
    current_recording = models.CharField(max_length=255, default="")

class Recording(models.Model):
    """The EEG file under analysis"""
    name = models.CharField(max_length=255)

class Feature(models.Model):
    """highlighted features on the EEG waveform, such as sleep spindles and k-complexes"""
    recording = models.ForeignKey(Recording)
    annotator = models.ForeignKey(Annotator)
    feature_type = models.CharField(max_length=255)
    start = models.DecimalField(max_digits=10, decimal_places=2)
    end = models.DecimalField(max_digits=10, decimal_places=2)
    channel = models.CharField(max_length=255)
    certainty = models.DecimalField(max_digits=10, decimal_places=9) # 0 to 1.000 000 000 (9 digits)

    def as_dict(self):
        """convert all fields into a dictionary so that it can eventually be JSON serialized"""
        return dict(feature_type=self.feature_type, start=float(self.start), end=float(self.end), channel=self.channel)