$("document").ready(function () {
  $("#btn-mine").click(function () {
    $.ajax({
      url: "/mine-transactions",
      success: function (response) {
        alert(response.message);
        location.reload();
      },
      error: function (response) {
        alert(data.responseJSON.message);
      },
    });
  });
  $
});
