$(document).ready(function() {
    console.log("this code is running")
    $('#ethics-agreement').change(function() {

        if(this.checked) {
            console.log("called")
            $('#start-task').prop('disabled', false)
        } else {
            $('#start-task').prop('disabled', true)
        }

        $('#start-task').click(function() {
            /* move one window forwards */
            window.location.replace("/viewer/")
        });
    });
});