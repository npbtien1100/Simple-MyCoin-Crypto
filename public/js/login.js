$(document).ready(function () {
  console.log("ready part 2");
  $("#login-form").submit(function (e) {
    e.preventDefault();
    $.ajax({
      type: "POST",
      url: "/login",
      data: $("#login-form").serialize(),
      success: function (response) {
        window.location.href = "/";
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
