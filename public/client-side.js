window.onload = function() {
  function postNew(leadStatus, assignedTo) {
    $.ajax({
      url: "/api/run",
      type: "POST",
      data: { leadStatus: leadStatus, assignedTo: assignedTo }
    }).then(function(response) {
      console.log(response);
    });
  }

  $(".submit-button").click(function(event) {
    event.preventDefault();
    const leadStatus = $("#lead-status").val();
    const assignedToNodes = $("input:checked");
    const assignedTo = [];
    if (assignedToNodes.length !== 0) {
      for (i = 0; i < assignedToNodes.length; i++) {
        assignedTo.push(assignedToNodes[i].id);
      }
    }
    postNew(leadStatus, assignedTo);
  });
};
