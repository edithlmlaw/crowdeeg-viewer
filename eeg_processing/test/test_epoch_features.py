from epoch_features import *
from numpy.testing import assert_array_almost_equal, assert_almost_equal, assert_equal


def test_total_power_frequency():
    # Test sin waves
    sampling_frequency = 10000
    time = np.arange(0, 2, 1.0 / sampling_frequency)
    amplitude = 6.5
    signal = amplitude * np.sin(2 * np.pi * 150 * time)
    signal = np.reshape(signal, ( 2 * sampling_frequency, 1))
    # Test function using sin wave signals
    total_power_frequency = compute_total_power_frequency_on_signal(signal, sampling_freq=sampling_frequency)
    expected_power = amplitude ** 2 / 2
    assert_array_almost_equal(total_power_frequency, expected_power, 3)


def test_compute_root_mean_square():
    values = [4, 4, 2, 1, 3]
    assert_almost_equal(compute_root_mean_square(values), 3.033, decimal=3)


def test_max_peak_to_peak_amplitude():
    values = [4, 4, 2, -1, 3]
    assert_equal(compute_max_peak_to_peak_amplitude(values), 5)

