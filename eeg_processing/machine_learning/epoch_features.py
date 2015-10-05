import numpy as np

from config import defaults
from filter import band_pass_filter, high_pass_filter

def signals_to_epochs(signal_dictionary):
    """Filter the signal data using BP and Notch filters.
    Aggregate the signal data into epochs (30 seconds per epoch, 30 * sampling_frequency data per epoch)

    Args:
        signal_dictionary: dictionary of lists of EEG and EMG data
        log: option to log the progress of the function

    Returns:
        epochs: dictionary of data_file dictionaries, each containing dictionaries of lists of filtered EEG and EMG data
    """
    epochs = []

    for channel, signal in signal_dictionary.iteritems():
        # determine signal type and use the appropriate boundary frequencies for BP filter
        if channel in (EMG1, EMG2):
            low_bound_freq = EMG_LOW_BOUND_FREQUENCY
            high_bound_freq = EMG_HIGH_BOUND_FREQUENCY
        else:
            low_bound_freq = EEG_LOW_BOUND_FREQUENCY
            high_bound_freq = EEG_HIGH_BOUND_FREQUENCY

        # apply BP filter
        filtered_signal, _ = band_pass_filter(signal, low_bound_freq,
                                              high_bound_freq, SAMPLING_FREQUENCY)
        # apply Notch filter to remove AC interference
        filtered_signal = notch_filter(filtered_signal, NOTCH_FREQUENCY,
                                       NOTCH_FREQUENCY_BANDWIDTH, SAMPLING_FREQUENCY)

        # aggregate data into epochs
        start_idx = 0
        end_idx = SAMPLES_PER_EPOCH
        epoch_idx = 0

        while end_idx <= len(filtered_signal):
            if not epoch_idx < len(epochs):
                epochs.append({})

            epochs[epoch_idx][channel] = filtered_signal[start_idx:end_idx]
            epoch_idx += 1
            start_idx = end_idx
            end_idx += SAMPLES_PER_EPOCH
    return epochs

def compute_total_power_frequency_on_signal(signal, sampling_freq=defaults.SAMPLING_FREQUENCY):
    """Compute the total power frequency using Parseval's Theorem
    https://en.wikipedia.org/wiki/Parseval%27s_theorem

    Args:
        signal: the input data (1d-array).
        sampling_freq: frequency used to determine Nyquist Frequency.
    Returns:
        total_power_frequency: a float that represents the total power frequency of the freq_spectrum.

    """
    power = np.abs(np.fft.fft(signal)) ** 2
    power = power[:len(power) / 2]
    total_power_frequency = float(np.sum(power)) / sampling_freq
    return total_power_frequency


def compute_power_frequency_on_spectrum(signal, low_bound_freq, high_bound_freq=None):
    """Compute the total power frequency on a particular spectrum

    Args:
        signal: the input data (1d-array).
        lower_bound_freq: the lower bound frequency below which the signal must be completely attenuated.
        higher_bound_freq: the higher bound frequency above which the signal must be completely attenuated.
    Returns:
        total_power_frequency: a float that represents the total power frequency of the freq_spectrum.

    """
    if high_bound_freq is None:
        filtered_freq = high_pass_filter(signal, low_bound_freq, defaults.SAMPLING_FREQUENCY)
    else:
        filtered_freq = band_pass_filter(signal, low_bound_freq, high_bound_freq, defaults.SAMPLING_FREQUENCY)

    return compute_total_power_frequency_on_signal(filtered_freq)


def compute_power_ratio_on_eeg_frequency_spectra(signal):
    """Compute the power ratio of alpha, beta, theta, and delta spectrum against the entire signal

    Args:
        signal: the input data (1d-array).
    Returns:
        signal_spectra_power_ratio: a list of the spectra power ratio

    """
    signal_total_power = compute_total_power_frequency_on_signal(signal)
    alpha_spectrum_power = compute_power_frequency_on_spectrum(signal, defaults.ALPHA_LOW_BOUND_FREQUENCY,
                                                               defaults.ALPHA_HIGH_BOUND_FREQUENCY)
    beta_spectrum_power = compute_power_frequency_on_spectrum(signal, defaults.BETA_LOW_BOUND_FREQUENCY)
    theta_spectrum_power = compute_power_frequency_on_spectrum(signal, defaults.THETA_LOW_BOUND_FREQUENCY,
                                                               defaults.THETA_HIGH_BOUND_FREQUENCY)
    delta_spectrum_power = compute_power_frequency_on_spectrum(signal, defaults.DELTA_LOW_BOUND_FREQUENCY,
                                                               defaults.DELTA_HIGH_BOUND_FREQUENCY)

    signal_spectra_power = [alpha_spectrum_power, beta_spectrum_power, theta_spectrum_power, delta_spectrum_power]
    signal_spectra_power_ratio = [spectrum_power / signal_total_power for spectrum_power in signal_spectra_power]
    return signal_spectra_power_ratio


def compute_root_mean_square(signal):
    """Compute the Root Mean Square.
    It is defined as: RMS = sqrt(1/N * sum from n=1 to N of x_n^2)

    Args:
        signal: the input data (1d-array).
    Returns:
        Computed RMS value.
    """
    assert len(signal) > 0
    return np.sqrt(np.mean(np.power(signal, 2), axis=0))


def compute_max_peak_to_peak_amplitude(signal):
    """Compute the maximum peak to peak amplitude
    It is defined as AMP = max(signal) - min(signal)

    Args:
        signal: the input data (1d-array).
    Returns:
        Computed value
    """
    assert len(signal) > 0
    return max(signal) - min(signal)

