var eegDataLoader = new function() {
    /* Provides an API for accessing the EEG data, which is stored in CSV files*/
    this.request = function (recording, start_sample, window_length, callback) {
        /* send request to the python view getEEGData, which will pull it from 
        the relevant CSV file */
        var that = this;
        $.ajax({
            dataType: "json",
            url: "/eegdata/"+recording+"/"+start_sample+"/"+window_length+"/",
            success: function(json_data){
                that._expandForHighChart(json_data, callback)
            }
        });
    },
    this._expandForHighChart = function (eeg_data, graph_callback) {
        /* convert the minimal datastructure used for the AJAX transfer
        to the datastructure that's required to populate highchart */
        if (eeg_data) { // do not advance graph if past end of file
            var structuredForHighChart = [];
            var channels = eeg_data.ordered_channels;
            for (var ii=0; ii<channels.length; ii++) {
                var chartChannel = Object();
                chartChannel.data = [];
                chartChannel.name = channels[ii];
                for (var jj=0; jj<eeg_data[channels[ii]].length; jj++) {
                    chartDataPoint = Object();
                    chartDataPoint.x = eeg_data['time'][jj];
                    chartDataPoint.y = eeg_data[channels[ii]][jj];
                    chartChannel.data.push(chartDataPoint);
                }
                structuredForHighChart.push(chartChannel);
            }
            graph_callback(structuredForHighChart, channels);
        }
    }
}