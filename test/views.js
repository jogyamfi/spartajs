$(document).ready(function() {
  module("views", {
    setup: function() {
      var regionName = "region1";

      var region = new sparta.Region({
        name: regionName,
        el: "region1"
      });
    }
  });

  test("Create and Find View", function() {
    var view = new sparta.View({
      name: "view1",
      templateName: "template1",
      el: "view1",
      region: "region1"
    });

    var view2 = sparta.regionManager.findView("view1");

    var viewName = view2 ? view2.name : "Unknown";

    equal(viewName, "view1", "View created and added to region");

  });


});