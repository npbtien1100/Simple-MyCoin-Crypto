$(document).ready(function () {
  $("#send-coin-form").submit(function (e) {
    e.preventDefault();
    $.ajax({
      type: "POST",
      url: "/transaction",
      data: $("#send-coin-form").serialize(),
      success: function (response) {
        $("#result").empty();
        $("#result").append(
          `<div class="alert alert-success">${response.message}</div>`
        );
      },
      error: function (response) {
        $("#result").empty();
        $("#result").append(`<div class="alert
    alert-danger"> <strong>Error!</strong> ${response.responseJSON.message}
    </div>`);
      },
    });
  });
});
