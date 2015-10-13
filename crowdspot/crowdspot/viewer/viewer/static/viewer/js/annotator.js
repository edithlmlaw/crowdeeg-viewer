
"use strict"

$.widget('crowdspot.annotator', {

    vars: {
        width: 1200,
        marginTop: 5,
        marginBottom: 20,
        marginLeft: 65,
        marginRight: 22,
        x_interval: 20,
        xMin: 0,
        feature_type: 0,
        colors: {
            'Spindle': 'rgba(86,186,219,.5)', // blue
        },
        expert_colors: {
            'Spindle': 'rgba(0,0,0,.3)', // black
        },
        charts: [],
        active_plotbands: [],
        answerDisplayed: false,
    },

    options: {
        start_time: 0,
        recording: 'excerpt1_50',
        classes: [], // sleep stages
        features: ['Spindle'],
        feature_selection_enabled: true,
        navigation_enabled: false,
        load_prev_annoations: true,
        training_mode: false,
        mturk_classification_mode: false,
    },

    _create: function() {
        this._setupController(); // display the buttons above graph
        this._setupGraph();
    },

    _setupController: function() {
        this._setupFeaturePanel();
        this._setupNavigationPanel();
    },

    _setupFeaturePanel: function() {
        /* Display the K-complex and Spindle highlight buttons */
        var that = this;
        var firstFeature = this.options.features[0];
        that.vars.feature_type = firstFeature;
        if (this.options.feature_selection_enabled) {
            for (var i = 0; i < this.options.features.length; i++) {
                var feature_name = this.options.features[i];
                $('#feature_panel').append("<button type='button' class='btn btn-default feature' id='" + feature_name + "'>" + feature_name + "</button>");
                $("<style type='text/css'> #" + feature_name + ".active { background-color: " + that.vars.colors[feature_name] + "} </style>").appendTo("head");
            }
            $('.feature').click(function(event) {
                var type = event.target.innerHTML;
                $(this).addClass('active');
                $(this).siblings().removeClass('active');
                that.vars.feature_type = type;
            });
            $('#' + firstFeature).addClass('active');
            $('#' + firstFeature).siblings().removeClass('active');
        }
    },

    _setupNavigationPanel: function() {
        /* Display the arrow buttons used to skip forward and backward through the EEG */
        var that = this;
        var FORWARD = true;
        var BACKWARD = false;
        var FFW_WINDOWS = 5; // number of windows to skip in fast forward mode
        // navigation will be disabled for some of the mechanical turk experiments
        if (that.options.navigation_enabled) {

            $('#forward').click(function() {
                /* move one window forward */
                that._shiftChart(FORWARD, 1);
            });

            $('#backward').click(function() {
                /* move one window backward */
                that._shiftChart(BACKWARD, 1);
            });

            $('#fastForward').click(function() {
                /* skip five windows forward */
                that._shiftChart(FORWARD, FFW_WINDOWS);
            });

            $('#fastBackward').click(function() {
                /* skip five windows backward */
                that._shiftChart(BACKWARD, FFW_WINDOWS);
            });
        }

        if (that.options.mturk_classification_mode) {
            $('#nextWindow').prop('disabled', true);

            $('#nextWindow').click(function() {
                that._shiftChart(nextWindow, 1);
                $('#nextWindow').prop('disabled', true);
                that.vars.answerDisplayed = false;
            });

            $('#noSpindles').click(function() {
                /* move one window forwards */
                $('#nextWindow').prop('disabled', false)
                var chart = that.vars.charts[0];
                that._getAnnotations(chart.xAxis[0].min, chart.xAxis[0].max, true);
                that.vars.answerDisplayed = true;
            });

            $('#submit').click(function() {
                /* move one window forwards */
                $('#nextWindow').prop('disabled', false)
                var chart = that.vars.charts[0];
                that._getAnnotations(chart.xAxis[0].min, chart.xAxis[0].max, true);
                that.vars.answerDisplayed = true;
            });

            $('#tutorial').click(function() {
                window.open('/static/files/tutorial.pdf', '_blank');
            });
        }

        $('#logout').click(function() {
            window.location.replace("/logout/")
        });
    },

    _shiftChart: function(forward, num_windows) {
        /* Advance or reverse the chart */
        var that = this;
        var chart = that.vars.charts[0];
        if (forward) {
            var min = chart.xAxis[0].min + that.vars.x_interval * num_windows;
            var max = chart.xAxis[0].max + that.vars.x_interval * num_windows;
        } else {
            var min = chart.xAxis[0].min - that.vars.x_interval * num_windows;
            var max = chart.xAxis[0].max - that.vars.x_interval * num_windows;
        }

        that.vars.xMin = min;
        that._loadData();
    },

    _getUserProgress: function() {
        var that = this;
        $.ajax({
            dataType: "json",
            url: "/users/getProgress",
            success: function(progress_data) {
                if (progress_data.recording) {
                    that.options.recording = progress_data.recording;
                }
                if (progress_data.start_time) {
                    that.options.start_time = progress_data.start_time;
                }
                that.vars.xMin = that.options.start_time;
                that._loadData();
            }
        });
    },

    _setupGraph: function() {
        /* this should probably be generalized */
        var that = this;
        that._getUserProgress();
    },

    _loadData: function() {
        /* Gets the relevant section from the EEG csv files and displays it on the chart
        see also: eegdata.js */
        var that = this;
        // remove any notifications that may have been displayed on the prev window
        $('#notification').remove();
        eegDataLoader.request(this.options.recording, that.vars.xMin, that.vars.x_interval,
            function(eeg_data, channels) {
                that._populateGraph(eeg_data, channels);
            }
        );
    },

    _populateGraph: function(data, channels) {
        /* plot all of the points to the chart */
        var that = this;
        for (var i = 0; i < data.length; ++i) {
            var chart;
            that.vars.charts.push(chart);
        }
        for (var i = 0; i < channels.length; ++i) {
            $('#graph').append("<div id='" + data[i].name + "' style='margin: 0 auto'></div>");
            that.vars.charts[i] = new Highcharts.Chart({
                chart: {
                    marginRight: 100,
                    renderTo: data[i].name,
                    height: 200,
                    width: 1200,
                    marginTop: that.vars.marginTop,
                    marginBottom: that.vars.marginBottom,
                    marginLeft: that.vars.marginLeft,
                    marginRight: that.vars.marginRight,
                    events: {
                        selection: function(event) {   
                            if (!that.vars.answerDisplayed) {
                                var xMin = event.xAxis[0].min;
                                var xMax = event.xAxis[0].max;
                                that._selectRegion(this, xMin, xMax, that.vars.feature_type, true); 
                            }
                            return false; // otherwise the chart will zoom                    
                        }
                    },
                    zoomType: 'x', // needed for selection to work!, do not remove
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: ''
                },
                tooltip: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        turboThreshold: 0,
                        lineWidth: 1,
                        enableMouseTracking: false, // annoying for this task
                        color: 'black'
                    },
                    line: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                xAxis: {
                    gridLineWidth: 1,
                    labels: {
                        crop: false,
                        // only show x axis labels on the bottom chart
                        enabled: i == channels.length - 1,
                        step: 5,
                        formatter: function() { // display time as HH:MM:SS
                            var s = this.value;
                            var h = Math.floor(s / 3600); //Get whole hours
                            s -= h * 3600;
                            var m = Math.floor(s / 60); //Get remaining minutes
                            s -= m * 60;
                            return h + ":" + (m < 10 ? '0' + m : m) + ":" + (s < 10 ? '0' + s : s); //zero padding on minutes and seconds
                        },
                    },
                    tickInterval: 1,
                    minorTickInterval: 0.5,
                    min: that.vars.xMin,
                    max: that.vars.xMin + that.vars.x_interval,
                    unit: [
                        ['second', 1]
                    ],
                },
                yAxis: {
                    tickInterval: 100,
                    minorTickInterval: 50,
                    min: -200, // this works pretty well for most EEG, but may require tweaking
                    max: 200,
                    gridLineWidth: 1, // 1px because anything more obscures the EEG
                    title: {
                        text: data[i].name
                    },
                    labels: {
                        enabled: true,
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{
                    name: data[i].name,
                    type: 'line',
                    data: data[i].data
                }]

            });
        }

        if (that.options.load_prev_annoations) {
            var chart = that.vars.charts[0];
            that._getAnnotations(chart.xAxis[0].min, chart.xAxis[0].max, false);
        }
    },

    _selectRegion: function(chart, xMin, xMax, featureType, save, isAnswerDisplay) {
        /* Makes spindle and k-complex selection work */
        var that = this;

        // show expert annotations in a different colour
        if (isAnswerDisplay) {
            var color = this.vars.expert_colors[featureType];
        } else {
            var color = this.vars.colors[featureType];
        }

        var selection_time = new Date().getMilliseconds();
        var plotband_id = selection_time + Math.random() * 100;
        var xMinFixed = parseFloat(xMin).toFixed(2);
        var xMaxFixed = parseFloat(xMax).toFixed(2);
        that.vars.active_plotbands.push(plotband_id) // keep list of all highlights on screen

        var that = this;
        chart.xAxis[0].addPlotBand({
            from: xMin,
            to: xMax,
            color: color,
            id: plotband_id,
            events: {
                dblclick: function() {
                    if (!isAnswerDisplay) {
                        chart.xAxis[0].removePlotBand(plotband_id)
                        that._deleteFeature(that.options.recording, xMinFixed, xMaxFixed, chart.renderTo.id);
                    }
                }
            }
        });
        if (save) {
            this._saveFeature(that.options.recording, that.vars.feature_type, xMinFixed, xMaxFixed, chart.renderTo.id, 1.0);
        }
    },

    _getAnnotations: function(window_start, window_end, use_expert_annotations) {
        /* Get all of the past feature annotations and sleep stage classification for this window */
        var that = this;

        $.ajax({
            dataType: "json",
            url: '/viewer/getannotations',
            data: {
                'recording_name': that.options.recording,
                'window_start': window_start,
                'window_end': window_end,
                'use_expert_annotations': use_expert_annotations
            },
            success: function(obj, status) {
                if (obj.features.length === 0 && use_expert_annotations) {
                    // display a message stating that there are no annotations
                    $('#notification_panel').append('<p id="notification">ANSWER: THIS WINDOW DOES NOT CONTAIN ANY SPINDLES</p>');
                } 

                for (var i = 0; i < obj.features.length; i++) {
                    var feature = obj.features[i];
                    var channel_name = feature.channel;
                    var start_time = feature.start;
                    var end_time = feature.end;
                    var feature_type = feature.feature_type;
                    var chart = $('#' + channel_name).highcharts();

                    if (chart != undefined) {
                        that._selectRegion(chart, start_time, end_time, feature_type, false, use_expert_annotations);
                    }
                }
            }
        });
    },

    _saveFeature: function(recording, feature_type, start, end, channel, certainty_score) {
        /* Save the feature highlight to the database */
        var that = this;

        $.post('/viewer/addfeature', {
                'feature_type': feature_type,
                'channel': channel,
                'time_start': start,
                'time_end': end,
                'channel': channel,
                'certainty_score': certainty_score,
                'recording_name': recording
            },
            function(obj, status) {}
        );
    },

    _deleteFeature: function(recording, time_start, time_end, channel) {
        /* remove the feature annotation from the database */
        var that = this;

        $.post('/viewer/deletefeature', {
                'time_start': time_start,
                'time_end': time_end,
                'channel': channel,
                'recording_name': recording,
            },
            function(obj, status) {}
        );
    },
});