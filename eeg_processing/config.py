from collections import OrderedDict
# EDF profile - signal channel numbers to the names we wish to use
edf_profiles = {
    'DREAMS': OrderedDict([
        ('Time', 'time'),
        #('8', 'FP1-A1'),
        ('3', 'CZ-A1'), # one channel is enough for MTURK!
        #('1', 'O1-A1'),
    ])
}

# EDF File Defaults
EDF_FILE_PATH = '.'

# Filter Defaults
EEG_LOW_BOUND_FREQUENCY = 0.3
EEG_HIGH_BOUND_FREQUENCY = 35
EMG_LOW_BOUND_FREQUENCY = 10
EMG_HIGH_BOUND_FREQUENCY = 100
NOTCH_FREQUENCY = 60
NOTCH_FREQUENCY_BANDWIDTH = 2