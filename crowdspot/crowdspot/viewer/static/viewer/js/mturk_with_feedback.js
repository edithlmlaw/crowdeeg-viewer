
$( document ).ready(function() {
    $('#graph_container').annotator(
        {
        	navigation_enabled: false,
            load_prev_annotations: false,
            mturk_mode: true,
            answer_display: true,
            start_time: 280,
            end_time: 1050,
            progress_bar_enabled: true,
        });
});