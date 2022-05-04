$(document).ready(function () {
  $("#register-form").submit(function (e) {
    e.preventDefault();
    $.ajax({
      type: "POST",
      url: "/register",
      data: $("#register-form").serialize(),
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
  $("#get-key").click(function (e) {
    $.ajax({
      type: "GET",
      url: "/api/create-keypair",
      success: function (response) {
        $("#publicKey").val(response.publicKey);
        $("#privateKey").val(response.privateKey);
      },
      error: function (response) {
        $("#result").empty();
        $("#result").append(`<div class="alert
  alert-danger"> <strong>Error!</strong> ${response.responseJSON.message}
  </div>`);
      },
    });
  });
  $("#confirm-checkbox").change(function () {
    if (this.checked) {
      $("#create-wallet").attr("disabled", false);
    } else {
      $("#create-wallet").attr("disabled", true);
    }
  });
});
