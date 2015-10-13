import os
import collections
import subprocess
import logging
from glob import iglob
from pprint import pprint
import csv

from config import *
from eeg_filter import band_pass_filter, notch_filter

SOURCE_FILE_DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def convert_edf_to_ascii(dir_path):
    """uses the executable edf2ascii to convert EDF docs to CSV format"""
    file_paths = []
    for edf_fp in iglob(dir_path+'*.edf'):
        fn = os.path.splitext(os.path.basename(edf_fp))[0]
        data_fp = os.path.join(os.path.dirname(edf_fp), fn+'_data.txt')
        file_paths.append((fn, data_fp))
        # checks to ensure that edf2ascii has not already converted this file during a previous run
        if not os.path.isfile(data_fp):
            logging.info("Converting {} to ascii".format(edf_fp))
            subprocess.call([os.path.join(SOURCE_FILE_DIRECTORY, 'edf2ascii'), edf_fp])
    return file_paths

def parse_edf_data(edf_profile, data_fp):
    """parses the output of edf2ascii to extract the signal channels of interest
    based on the EDF profile. The EDF profile is a list structure that matches 
    channels in the EDF to the column names used in the webapp.

    For example, this is the EDF profile used for the dreams database:
        'DREAMS': [
            ('Time', 'time'),
            ('2', 'FP1-A1'),
            ('3', 'CZ-A1'),
            ('5', 'EOG1-A1'),
        ]
    """
    eeg_signals = collections.OrderedDict()
    # get sample rate
    sample_rate = get_sample_rate(data_fp)

    logging.debug("measured sample rate of {}".format(sample_rate))
    with open(data_fp, 'r') as f:
        logging.info("Extracting signals of interest from: {}".format(data_fp))
        reader = csv.reader(f)
        header = next(reader)

        for edf_col, web_col in edf_profile.iteritems():
            if not edf_col in header:
                logging.warn("EEG Trace: {} does not exist in: {}".format(edf_col, data_fp))
            else:
                eeg_signals[web_col] = []

        for row in reader:
            for hd, data_point in zip(header, row):
                if hd in edf_profile:
                    eeg_signals[edf_profile[hd]].append(float(data_point))      

    return eeg_signals, sample_rate

def get_sample_rate(data_fp):
    """this is a crude method for finding the sample rate of an EDF file.
    A much better method would be to get that information from the headers
    of the EDF, but I had issues with different formats when I tried that
    """    
    with open(data_fp, 'r') as f:
        logging.debug("Trying to determine sample rate of: {}".format(data_fp))
        reader = csv.reader(f)
        header = next(reader)
        sample_rate = 0
        for row in reader:
            if not '.' in row[0]:
                logging.warn("Time value not in seconds in file, can not downsample: {}".format(data_fp))
            if float(row[0]) < 1:
                sample_rate += 1
            else:
                break
    return sample_rate

def get_downsample_ratio(sample_rate):
    """data must be downsampled to a rate between 16-30Hz to avoid lag on the 
    web interface. we want the downsampling ratio to be an even divisor of the 
    sample_rate so that each window has an equal number of points
    """
    for final_sample_rate in xrange(41, 80):
        if sample_rate % final_sample_rate == 0:
            logging.debug("final sample rate should be: {}".format(final_sample_rate))
            return sample_rate / final_sample_rate

def filter_eeg_signals(eeg_signals, sample_rate):
    """Currently only applying a 60Hz notch filter. It can sometimes be
    advisable to also apply a bandpass filter, but that's only really useful
    when the signal was collected at >200Hz
    """
    for channel, signal in eeg_signals.iteritems():
        if not channel.find('time') > -1:
            low_bound_freq = EEG_LOW_BOUND_FREQUENCY
            high_bound_freq = EEG_HIGH_BOUND_FREQUENCY
            filtered_signal = notch_filter(signal, NOTCH_FREQUENCY,
                                           NOTCH_FREQUENCY_BANDWIDTH, sample_rate)
            eeg_signals[channel] = filtered_signal
    return eeg_signals

def save_filtered_signals_to_csv(csv_fp, eeg_data, downsample_ratio):
    """saves the documents to CSV, so that they can be uploaded into InfluxDB
    the fieldnames parameter can be used to specify the column order if desired
    """
    logging.info("Saving EEG data to file: {}".format(csv_fp))
    with open(csv_fp, 'wb') as f:
        writer = csv.writer(f)
        fieldnames = eeg_data.keys()
        writer.writerow(fieldnames)

        # xrange args -- start, stop, step
        for ii in xrange(0, len(eeg_data[fieldnames[0]]), downsample_ratio):
            writer.writerow([eeg_data[key][ii] for key in fieldnames])

def convert_edfs(edf_profile, edf_dir, out_dir, filter_eeg, downsample):
    """the main method, runs all of the parsing and filtering methods and 
    assigns file names
    """
    file_paths = convert_edf_to_ascii(edf_dir)
    for edf_fn, data_fp in file_paths:
        eeg_data, sample_rate = parse_edf_data(edf_profile, data_fp)
        if filter_eeg:
            eeg_data = filter_eeg_signals(eeg_data, sample_rate)
        if downsample:
            downsample_ratio = get_downsample_ratio(sample_rate)
            logging.debug("Downsampling with ratio {}".format(downsample_ratio))
        else:
            downsample_ratio = 1

        csv_fp = os.path.join(out_dir, edf_fn + '_{}'.format(sample_rate/downsample_ratio) + '.csv')
        save_filtered_signals_to_csv(csv_fp, eeg_data, downsample_ratio)

if __name__ == '__main__':
    # testing code, does not usually run
    data_fps = convert_edf_to_ascii('../../../')
    eeg_data, sample_rate = parse_edf_data(DREAMS, data_fps[0][1])
    filtered_eeg = filter_eeg_signals(eeg_data, sample_rate)
    save_filtered_signals_to_csv('test_doc.csv', eeg_data, None)
