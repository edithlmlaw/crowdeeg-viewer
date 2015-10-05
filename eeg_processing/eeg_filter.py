import numpy as np

from scipy.signal import lfilter
from scipy.signal import remez


def band_pass_filter(signal_input, lower_bound_freq, higher_bound_freq, sampling_freq, filter_order=2):
    """Applying band-pass filter

    Args:
        signal_input: the input data (1d-array).
        lower_bound_freq: the lower bound frequency below which the signal must be completely attenuated.
        higher_bound_freq: the higher bound frequency above which the signal must be completely attenuated.
        sampling_freq: the sampling frequency of the recorded data.
        filter_order: a number showing the complexity of the filter structure
                      `remez` function get the number of taps as input. The number of taps is the
                      number of terms in the filter, or the filter order plus one.

    Returns:
        filtered_signal: the filtered signal (1d-array)
        filter_coefficients:  the coefficients of the optimal filter for the band pass filter
    """
    filter_coefficients = remez(filter_order + 1,
                                [0, 0.9 * lower_bound_freq, lower_bound_freq, higher_bound_freq,
                                 1.1 * higher_bound_freq, 0.5 * sampling_freq],
                                [0, 1.0, 0], Hz=sampling_freq)
    filtered_signal = lfilter(filter_coefficients, 1, signal_input)
    return filtered_signal, filter_coefficients

def notch_filter(signal_input, notch_freq, band_width, sampling_freq):
    """Applying notch (band-stop) filter

    Args:
        signal_input: the input data (1d-array).
        notch_freq: the main frequency to be filtered from the signal (for example, 60 Hz transmission line noise)
        band_width: the band width around the notch_freq center whose containing frequencies also must be attenuated
                    but not in the same level as notch_freq center
        sampling_freq: the sampling frequency of the recorded data.

        Note that:
        The notch filter is designed using "Recursive Filters" techniques explained here (Page 326):
        http://www.analog.com/static/imported-files/tech_docs/dsp_book_Ch19.pdf

        y[n] = a_0 * x[n] + a_1 * x[n-1] + a_2 * x[n-2] + b_1 * y[n-1] + b_2 * y[n-2]
              (x_i are the inputs, y_i are the outputs)

    Returns:
        filtered_signal: the filtered signal (1d-array)
        filter_coefficients:  the coefficients of the optimal filter for the notch filter
    """
    R = 1 - 3 * (band_width / float(sampling_freq))
    x = np.cos(2 * np.pi * notch_freq / float(sampling_freq))
    K = (1 - 2 * R * x + R * R) / float(2 - 2 * x)

    a0 = K
    a1 = -2 * K * x
    a2 = K
    b1 = 2 * R * x
    b2 = - R * R

    numerator_coefficient = [a0, a1, a2]
    denominator_coefficient = [1, -b1, -b2]
    filtered_signal = lfilter(numerator_coefficient, denominator_coefficient, signal_input)
    return filtered_signal

def low_pass_filter(signal_input, cut_off_freq, sampling_freq, filter_order=2):
    """Applying low-pass filter

    Args:
        signal_input: the input data (1d-array).
        cut_off_freq: frequency above which the signals are attenuated
        sampling_freq: the sampling frequency of the recorded data.
        filter_order: a number showing the complexity of the filter structure
                      `remez` function get the number of taps as input. The number of taps is the
                      number of terms in the filter, or the filter order plus one.
    Returns:
        filtered_signal: the filtered signal (1d-array)
        filter_coefficients:  the coefficients of the optimal filter for the low pass filter

    """
    filter_coefficients = remez(filter_order + 1,
                                [0, 0.9 * cut_off_freq, 1.1 * cut_off_freq, 0.5 * sampling_freq],
                                [1.0, 0], Hz=sampling_freq)
    filtered_signal = lfilter(filter_coefficients, 1, signal_input)
    return filtered_signal, filter_coefficients

def high_pass_filter(signal_input, cut_off_freq, sampling_freq, filter_order=2):
    """Applying high-pass filter

    Args:
        signal_input: the input data (1d-array).
        cut_off_freq: frequency below which the signals are attenuated.
        sampling_freq: the sampling frequency of the recorded data.
        filter_order: a number showing the complexity of the filter structure
                      `remez` function get the number of taps as input. The number of taps is the
                      number of terms in the filter, or the filter order plus one.

    Returns:
        filtered_signal: the filtered signal (1d-array)
        filter_coefficients:  the coefficients of the optimal filter for the high pass filter

    """
    filter_coefficients = remez(filter_order + 1,
                                [0, 0.9 * cut_off_freq, 1.1 * cut_off_freq, 0.5 * sampling_freq],
                                [0, 1.0], Hz=sampling_freq)
    filtered_signal = lfilter(filter_coefficients, 1, signal_input)

    return filtered_signal, filter_coefficients