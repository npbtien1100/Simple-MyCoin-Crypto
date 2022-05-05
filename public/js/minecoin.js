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

  const datatablesSimple = document.getElementById("datatablesSimple");
  if (datatablesSimple) {
    new simpleDatatables.DataTable(datatablesSimple, { select: true });
  }
});
