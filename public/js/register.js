$(document).ready(function () {
  $("#register-form").submit(function (e) {
    e.preventDefault();
    $.ajax({
      type: "POST",
      url: "/api/register",
      data: $("#register-form").serialize(),
      success: function (response) {
        $("#register-form").hide();
        $("#result").append(`<div class="alert alert-success">
                <strong>Success!</strong> You have been registered.
                </div>
                <div>Username: ${response.username}</div>
                <div>Password: ${response.password}</div>`);
      },
    });
  });
});
