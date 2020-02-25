window.onload = function() {
  function postNew(leadStatus) {
    $.ajax({
      url: "/api/run",
      type: "POST",
      data: { leadStatus: leadStatus }
    }).then(function(response) {
      console.log(response);
    });
  }

  $(".submit-button").click(function(event) {
    event.preventDefault();
    const leadStatus = $("#lead-status").val();
    postNew(leadStatus);
  });
};
