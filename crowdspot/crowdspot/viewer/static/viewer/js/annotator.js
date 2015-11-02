"use strict"

$.widget('crowdspot.annotator', {

    vars: {
        width: 1200,
        marginTop: 5,
        marginBottom: 20,
        marginLeft: 65, // space for the last HH:MM:SS label
        marginRight: 22, // space for the channel names
        xMin: 0,
        xMax: 20,
        x_interval: 20,
        feature_type: 0,
        colors: {
            'Spindle': 'rgba(86,186,219,.5)', // blue // rgba(224,27,47,.42)
        },
        answer_colors: {
            'Spindle': 'rgba(0,0,0,.3)', // black
        },
        charts: [],
        active_plotbands: [],
        answerDisplayed: false,
    },

    options: {
        start_time: 0,
        end_time: null, // if null defaults to end of recording, must be set for progress bar
        recording: 'excerpt1_50',
        classes: [], // sleep stages
        features: ['Spindle'],
        feature_selection_enabled: true, // users are able 
        navigation_enabled: false,
        progress_bar_enabled: false,
        load_prev_annotations: true,

        // mechanical turk specific options:
        mturk_mode: false, // changes the navigation over to mTurk style
        answer_display: false, // displays the answer after each window is complete
    },

    _create: function() {
        /* This is the constructor that jQuery calls, runs first */
        var that = this;
        that._setupFeaturePanel(); // setup and display the feature highlight buttons
        that._setupNavigationPanel(); // setup the navigation system
        that._getUserProgress(); // jump to wherever user left off (essential for page refreshes)
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
                /* skip forward by the number of windows specified in FFW_WINDOWS */
                that._shiftChart(FORWARD, FFW_WINDOWS);
            });

            $('#fastBackward').click(function() {
                /* skip backward by the number of windows specified in FFW_WINDOWS */
                that._shiftChart(BACKWARD, FFW_WINDOWS);
            });
        }

        if (that.options.mturk_mode) {
            $('#nextWindow').prop('disabled', true);

            $('#nextWindow').click(function() {
                that._shiftChart(nextWindow, 1);
                $('#notification').remove();
                $('#nextWindow').prop('disabled', true);
                that.vars.answerDisplayed = false;
                var chart = that.vars.charts[0];
                if (chart.xAxis[0].min + that.vars.x_interval > that.options.end_time) {
                    window.location.replace("/feedback/")
                }
            });

            $('#noSpindles').click(function() {
                /* move one window forwards */
                var chart = that.vars.charts[0];
                if (that.options.answer_display) {
                    that._getAnnotations(chart.xAxis[0].min, chart.xAxis[0].max, true);
                    that.vars.answerDisplayed = true;
                }
            });

            $('#submit').click(function() {
                /* display the answer, and enable the nextWindow button */
                var chart = that.vars.charts[0];

                if (that.options.answer_display) {
                    that._getAnnotations(chart.xAxis[0].min, chart.xAxis[0].max, true);
                    that.vars.answerDisplayed = true;
                }
            });
        }

        $('#logout').click(function() {
            window.location.replace("/logout/")
        });
    },

    _shiftChart: function(forward, num_windows) {
        /* Advance or reverse through the time series by num_windows */
        var that = this;
        var chart = that.vars.charts[0];
        if (forward) {
            var min = chart.xAxis[0].min + that.vars.x_interval * num_windows;
        } else {
            var min = chart.xAxis[0].min - that.vars.x_interval * num_windows;
        }

        that.vars.xMin = min;
        that.vars.xMax = min + that.vars.x_interval;
        that._loadData();
    },

    _getUserProgress: function() {
        /* sets viewer start time to the start of the window that the user 
        viewed during last session. Without this, the viewer would drop
        you on the first window after a page reset or logout */
        var that = this;
        $.ajax({
            dataType: "json",
            url: "/users/getProgress",
            success: function(progress_data) {
                if (progress_data.recording) {
                    that.options.recording = progress_data.recording;
                }
                if (progress_data.start_time) {
                    that.vars.xMin = progress_data.start_time;
                } else {
                    // user's first time logging in, start them at the start
                    that.vars.xMin = that.options.start_time;
                }
                that._loadData();
            }
        });
    },

    _updateProgressBar: function() {
        /* check what window the user is on and advance filled in portion of the progress bar */
        var that = this;
        var progress = (that.vars.xMin - that.options.start_time) / parseFloat(that.options.end_time - that.options.start_time) * 100;
        $('#progress_bar').css({'width': parseInt(progress) + '%'});
    },

    _loadData: function() {
        /* Gets the relevant section from the EEG csv files and displays it on the chart
        see also: eegdata.js */
        var that = this;
        // remove any notifications that may have been displayed on the prev window
        eegDataLoader.request(this.options.recording, that.vars.xMin, that.vars.x_interval,
            function(eeg_data, channels) {
                that._populateGraph(eeg_data, channels);
            }
        );
        if (that.options.progress_bar_enabled) {
            that._updateProgressBar()
        } else {
            // progress bar exists in the DOM, but is not displayed
            // this may be a questionable design choice
            $('#progress').remove();
        }
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
                    animation: false,
                    marginRight: 100,
                    renderTo: data[i].name,
                    height: 200,
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
                        animation: false,
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
                        formatter: function() {
                            /* Display time as HH:MM:SS */
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
                        enabled: !that.options.mturk_mode, // experts care about y-scaling, turkers don't
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

        if (that.options.load_prev_annotations) {
            var chart = that.vars.charts[0];
            // use the chart start/end so that data and annotations can never 
            // get out of synch
            that._getAnnotations(chart.xAxis[0].min, chart.xAxis[0].max, false);
        }
    },

    _selectRegion: function(chart, xMinBox, xMaxBox, featureType, save, isAnswerDisplay) {
        /* Makes spindle and k-complex selection work */
        var that = this;

        // show expert annotations in a different colour
        if (isAnswerDisplay) {
            var color = this.vars.answer_colors[featureType];
        } else {
            var color = this.vars.colors[featureType];
        }

        var selection_time = new Date().getMilliseconds();
        var plotband_id = selection_time + Math.random() * 100;
        var xMinFixed = parseFloat(xMinBox).toFixed(2);
        var xMaxFixed = parseFloat(xMaxBox).toFixed(2);
        that.vars.active_plotbands.push(plotband_id) // keep list of all highlights on screen

        var that = this;
        chart.xAxis[0].addPlotBand({
            from: xMinBox,
            to: xMaxBox,
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

    _getAnnotations: function(window_start, window_end, displaying_answer) {
        /* Get all of the past feature annotations and sleep stage classification for this window */
        var that = this;

        $.ajax({
            dataType: "json",
            url: '/viewer/getannotations',
            data: {
                'recording_name': that.options.recording,
                'window_start': window_start,
                'window_end': window_end,
                'displaying_answer': displaying_answer,
            },
            success: function(annotations, status) {
                that._displayAnnotations(annotations, displaying_answer);
                if (that.options.mturk_mode) {
                    $('#nextWindow').prop('disabled', false);
                }
            },
        });
    },

    _displayAnnotations: function(annotations, displaying_answer) {
        /* show populate the window with the annotations from the db */
        var that = this;
        if (annotations.features.length === 0 && displaying_answer) {
            // display a message stating that there are no annotations
            if (!$('#notification').length) {
                $('#notification_panel').append('<p id="notification">ANSWER: THIS WINDOW DOES NOT CONTAIN ANY SPINDLES</p>');
            }
        }

        for (var i = 0; i < annotations.features.length; i++) {
            var feature = annotations.features[i];
            var channel_name = feature.channel;
            var start_time = feature.start;
            var end_time = feature.end;
            var feature_type = feature.feature_type;
            var chart = $('#' + channel_name).highcharts();

            if (chart != undefined) {
                that._selectRegion(chart, start_time, end_time, feature_type, false, displaying_answer);
            }
        }
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