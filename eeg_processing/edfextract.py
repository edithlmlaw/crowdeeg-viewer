"""extractedf.py -- a tool for extracting batch processing EDF files into CSV 
format, so that they can be used with the crowdspot EEG viewer. 

Usage:
  edfextract.py [options] <edf_profile> <edf_dir> <output_dir>  


Options:
  -n --nofilter    Disable EEG signal filtering
  --logfile=<lf>    Log output to file
  --nodownsample    Do not downsample the EEG data
  -h --help         Show this screen
  --version         Show version

Arguments:
  <edf_profile>     List of the signals in the EDF, given in config.py
  <edf_dir>         The directory containing the EDF files
  <output_dir>      The directory to save the CSV files in.
"""

import sys
from docopt import docopt
from parsing import convert_edfs
import logging
from pprint import pprint
from config import edf_profiles

if __name__ == '__main__':
    # this parses the docstring above to make the CLI. see http://docopt.org
    arguments = docopt(__doc__)
    pprint(arguments)

    # setup handler for all the log messages from the other modules
    if arguments['--logfile']:
        logging.basicConfig(level=logging.INFO) # log to stdout/stderr
    else:
        # log to file
        logging.basicConfig(filename=arguments['--logfile'], level=logging.INFO)

    convert_edfs(edf_profiles[arguments['<edf_profile>']], arguments['<edf_dir>'], 
        arguments['<output_dir>'], not arguments['--nofilter'], not arguments['--nodownsample'])