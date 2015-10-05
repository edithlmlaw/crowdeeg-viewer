"use strict"

$.widget('crowdspot.annotator', {

    vars: {
        width: 1200,
        marginTop: 5,
        marginBottom: 20,
        marginLeft: 75,
        marginRight: 40,
        x_interval: 20,
        recording: 'excerpt1_50',
        xMin: 0,
        feature_type: 0,
        colors: {
            'Spindle': 'rgba(86,186,219,.5)',
        },
        charts: [],
    },

    options: {
        start_time: 0,
        classes: [], // sleep stages
        features: ['Spindle'],
        classification_enabled: true,
        feature_selection_enabled: true,
        navigation_enabled: true,
        load_prev_annoations: true
    },

    _create: function() {
        // !!! JAB redundant: remove
        this._setup();
    },

    _setup: function() {
        this._setupController(); // display the buttons above graph
        this._setupGraph(); 

    },

    _setupController: function() {
        this.element.append("<div id='graph_control'></div>");
        this._setupClassificationPanel();
        this._setupFeaturePanel();
        this._setupNavigationPanel();
    },

    _setupClassificationPanel: function() {
        /* Display the sleep stage selection buttons */
        if (this.options.classification_enabled) {
            var that = this;
            $('#graph_control').append("<div id='classification_panel' class='btn-group' role='group' aria-label='...''></div>");
            for (var i = 0; i < this.options.classes.length; i++) {
                var class_name = this.options.classes[i];
                $('#classification_panel').append("<button type='button' class='btn btn-default classification' id='" + class_name + "'>" + class_name + "</button>");
            }
            $('.classification').click(function(event) {
                var className = event.target.innerHTML;
                $(this).addClass('active');
                $(this).siblings().removeClass('active');
                var chart = that.vars.charts[0];
                that._saveClassfication(className, chart.xAxis[0].min, chart.xAxis[0].max, 1.0, 1);
            });
        }
    },

    _setupFeaturePanel: function() {
        /* Display the K-complex and Spindle highlight buttons */ 
        var that = this;
        var firstFeature = this.options.features[0];
        this.vars.feature_type = firstFeature;
        if (this.options.feature_selection_enabled) {
            $('#graph_control').append("<div id='feature_panel' class='btn-group' role='group' aria-label='...''></div>");
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
        $('#graph_control').append("<div id='navigation_panel'></div>");

        // navigation will be disabled for some of the mechanical turk experiments
        if (this.options.navigation_enabled) {
            $('#navigation_panel').append("<button type='button' class='btn btn-default' id='backward' aria-label='Left Align'><span class='glyphicon glyphicon-step-backward' aria-hidden='true'></span></button>");
            $('#navigation_panel').append("<button type='button' class='btn btn-default' id='forward' aria-label='Left Align'><span class='glyphicon glyphicon-step-forward' aria-hidden='true'></span></button>");
            
            $('#forward').click(function() {
                /* move one window forwards */
                var chart = that.vars.charts[0];
                // TODO: this._saveClassfication("N1", chart.xAxis[0].min, chart.xAxis[0].max, 1.0, 1);
                var min = chart.xAxis[0].min + that.vars.x_interval;
                var max = chart.xAxis[0].max + that.vars.x_interval;
                that.vars.xMin = min;
                that._loadData();
            });

            $('#backward').click(function() {
                /* move one window backwards */
                var chart = that.vars.charts[0];
                var min = chart.xAxis[0].min - that.vars.x_interval < 0 ? 0 : chart.xAxis[0].min - that.vars.x_interval;
                var max = min == 0 ? that.vars.x_interval : chart.xAxis[0].max - that.vars.x_interval;
                that.vars.xMin = min;
                that._loadData();
            });
        }
    },

    _setupGraph: function() {
        /* this should probably be generalized */
        this.vars.xMin = this.options.start_time;
        this.element.append("<div id='graph'></div>");
        this._loadData();
    },

    _loadData: function() {
        /* Gets the relevant section from the EEG csv files and displays it on the chart
        see also: eegdata.js 
        */
        var that = this;
        eegDataLoader.request(this.vars.recording, that.vars.xMin, that.vars.x_interval,
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
                    width: that._getchartWidth(),
                    marginTop: that.vars.marginTop,
                    marginBottom: that.vars.marginBottom,
                    marginLeft: that.vars.marginLeft,
                    marginRight: that.vars.marginRight,
                    events: {
                        selection: function(event) {
                            console.log('selection');
                            var xMin = event.xAxis[0].min;
                            var xMax = event.xAxis[0].max;
                            return that._selectRegion(this, xMin, xMax, that.vars.feature_type, true);
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
                        enableMouseTracking: false,
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
                        enabled: i==channels.length -1,
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
                        enabled: true
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
            that._getAnnotations(chart.xAxis[0].min, chart.xAxis[0].max);
        }

    },

    _selectRegion: function(chart, xMin, xMax, featureType, save) {
        /* Makes spindle and k-complex selection work */
        var that = this;
        if (!this.vars.zoomActive) {
            var color = this.vars.colors[featureType];
            var selection_time = new Date().getMilliseconds();
            var plotband_id = 'selection' + selection_time;
            var xMinFixed = parseFloat(xMin).toFixed(2);
            var xMaxFixed = parseFloat(xMax).toFixed(2);

            var that = this;
            chart.xAxis[0].addPlotBand({
                from: xMin,
                to: xMax,
                color: color,
                id: plotband_id,
                events: {
                    dblclick: function() {
                        chart.xAxis[0].removePlotBand(plotband_id)
                            /* Meng: add custom code here to remove this feature from server */
                        that._deleteFeature(that.vars.recording, xMinFixed, xMaxFixed, chart.renderTo.id);
                    }
                }
            });
            if (save) {
                this._saveFeature(that.vars.recording, that.vars.feature_type, xMinFixed, xMaxFixed, chart.renderTo.id, 1.0);
            }

            return false;
        } else {
            return true;
        }
    },

    _getAnnotations: function(window_start, window_end) {
        /* Get all of the past feature annotations and sleep stage classification for this window */
        var that = this;
        $.getJSON('/viewer/getannotations/' + that.vars.recording + '/' + window_start + '/' + window_end + '/',
            function(obj, status) {
                for (var i = 0; i < obj.features.length; i++) {
                    var feature = obj.features[i];
                    var channel_name = feature.channel;
                    var start_time = feature.start;
                    var end_time = feature.end;
                    var feature_type = feature.feature_type;
                    var chart = $('#' + channel_name).highcharts();

                    if (chart != undefined) {
                        that._selectRegion(chart, start_time, end_time, feature_type, false);

                        var classification = obj.classification;
                        // windows will not necessarily have a past classification
                        if (classification) {
                            $('#' + classification).addClass('active');
                            $('#' + classification).siblings().removeClass('active');
                        } 
                    }

                }
            }
        );
    },

    _saveFeature: function(recording, feature_type, start, end, channel, certainty_score) {
        /* Save the feature highlight to the database */
        console.log('calling saveFeature');
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
            function(obj, status) {
                console.log('saved feature');
            }
        );
    },

    _deleteFeature: function(recording, time_start, time_end, channel) {
        /* remove the feature annotation from the database */
        var that=this;

        $.post('/viewer/deletefeature', {
                'time_start': time_start,
                'time_end': time_end,
                'channel': channel,
                'recording_name': recording,
            },
            function(obj, status) {
                console.log('deleted feature');
            }

        );
    },

    _getchartWidth: function() {
        /* Set the width of the the chart, but limit it on widescreens to 
        keep the data from getting overly stretched */
        var WIDESCREEN_WIDTH = 1200;
        var window_width = $(window).width();
        if (window_width > WIDESCREEN_WIDTH) {
            return WIDESCREEN_WIDTH;
        } else {
            return window_width - 70;
        }
    }
});