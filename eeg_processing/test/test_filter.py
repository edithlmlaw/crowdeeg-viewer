import numpy as np

from ml.signalprocessing.filter import *


def test_band_pass_filter():
    """Test that the signals outside the lower and higher frequency bounds are attenuated by at least 3db while the
    signals within are not.

    """
    time = np.arange(0, 1, 1.0 / 1000)
    input_signal = np.sin(2 * np.pi * 50 * time) + np.sin(2 * np.pi * 300 * time) + np.sin(2 * np.pi * 450 * time)
    fft_original_signal = np.fft.fft(input_signal) / len(input_signal)

    filtered_signal, _ = band_pass_filter(input_signal, lower_bound_freq=250, higher_bound_freq=350,
                                          sampling_freq=1000, filter_order=10)
    fft_filtered_signal = np.fft.fft(filtered_signal) / len(filtered_signal)

    #3dB attenuation is a standard number to evaluate the amount of attenuation
    #http://electronics.stackexchange.com/questions/6959/what-is-the-significance-of-3db
    assert abs(np.log10(abs(fft_filtered_signal[450])) / np.log10(abs(fft_original_signal[450]))) > 3
    assert abs(np.log10(abs(fft_filtered_signal[300])) / np.log10(abs(fft_original_signal[300]))) < 1.1
    assert abs(np.log10(abs(fft_filtered_signal[50])) / np.log10(abs(fft_original_signal[50]))) > 3


def test_notch_filter():
    """Test that the signals within the notch filter are attenuated by at least 3db while the signals outside are not.

    """
    time = np.arange(0, 1, 1.0 / 1000)
    signal = np.sin(2 * np.pi * 55 * time) + np.sin(2 * np.pi * 58 * time) + np.sin(2 * np.pi * 60 * time) + \
             np.sin(2 * np.pi * 62 * time) + np.sin(2 * np.pi * 65 * time)

    fft_original_signal = np.fft.fft(signal) / len(signal)
    filtered_signal = notch_filter(signal, notch_freq=60, band_width=2, sampling_freq=1000)
    fft_filtered_signal = np.fft.fft(filtered_signal) / len(filtered_signal)

    assert abs(np.log10(abs(fft_filtered_signal[60])) / np.log10(abs(fft_original_signal[60]))) > 3
    assert abs(np.log10(abs(fft_filtered_signal[62])) / np.log10(abs(fft_original_signal[62]))) > 1.1
    assert abs(np.log10(abs(fft_filtered_signal[65])) / np.log10(abs(fft_original_signal[65]))) < 1.1


def test_low_pass_filter():
    """Test that the signals above the cutoff frequency are attenuated by at least 3db while the signals below are not.

    """
    time = np.arange(0, 1, 1.0 / 1000)
    input_signal = np.sin(2 * np.pi * 50 * time) + np.sin(2 * np.pi * 300 * time) + np.sin(2 * np.pi * 450 * time)
    fft_original_signal = np.fft.fft(input_signal) / len(input_signal)

    filtered_signal, _ = low_pass_filter(input_signal, cut_off_freq=200, sampling_freq=1000, filter_order=10)
    fft_filtered_signal = np.fft.fft(filtered_signal) / len(filtered_signal)

    assert abs(np.log10(abs(fft_filtered_signal[450]))/np.log10(abs(fft_original_signal[450]))) > 3
    assert abs(np.log10(abs(fft_filtered_signal[50]))/np.log10(abs(fft_original_signal[50]))) < 1.1


def test_high_pass_filter():
    """Test that the signals below the cutoff frequency are attenuated by at least 3db while the signals above are not.

    """
    time = np.arange(0, 1, 1.0 / 1000)
    input_signal = np.sin(2 * np.pi * 50 * time) + np.sin(2 * np.pi * 300 * time) + np.sin(2 * np.pi * 450 * time)
    fft_original_signal = np.fft.fft(input_signal) / len(input_signal)

    filtered_signal, _ = high_pass_filter(input_signal, cut_off_freq=300, sampling_freq=1000, filter_order=10)
    fft_filtered_signal = np.fft.fft(filtered_signal) / len(filtered_signal)

    assert abs(np.log10(abs(fft_filtered_signal[450])) / np.log10(abs(fft_original_signal[450]))) < 1.1
    assert abs(np.log10(abs(fft_filtered_signal[50])) / np.log10(abs(fft_original_signal[50]))) > 3

