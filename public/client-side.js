window.onload = function() {
  function postNew(data) {
    $.ajax({
      url: "/api/run",
      type: "POST",
      data: data
    }).then(function(response) {
      console.log(response);
    });
  }

  $(".submit-button").click(function(event) {
    event.preventDefault();
    //const currentLeadStatus = $("#current-lead-status").val();
    const crmLeadStatus = $("#crm-lead-status").val();
    const dialLeadStatus = $("#dial-lead-status").val();
    //const leadCreatedAt = $("#created-time").val();
    //const leadDOB = $("#date-of-birth").val();
    const URL = $("#url").val();
    /* function assignedTo(currentOrNew) {
      const assignedToNodes = $(
        `input:checked[name="${currentOrNew} Assigned To"]`
      );
      const assignedTo = [];
      if (assignedToNodes.length !== 0) {
        for (i = 0; i < assignedToNodes.length; i++) {
          assignedTo.push(assignedToNodes[i].id);
        }
      }
      return assignedTo;
    }
    const currentAssignedTo = assignedTo("current");
    const newAssignedTo = assignedTo("new"); */
    const newAssignedTo = $(`input:checked[name="new Assigned To"]`).val();
    const data = {
      crmLeadStatus: crmLeadStatus,
      dialLeadStatus: dialLeadStatus,
      newAssignedTo: newAssignedTo,
      URL: URL
    };
    postNew(data);
  });
};
