$(document).ready(function() {
  module("views", {
    setup: function() {

    }
  });

  asyncTest("Create and Load View", function() {

    expect(1);

    var regionName = "region1";

    var region = new sparta.Region({
      name: regionName,
      el: "region1"
    });

    var view = new sparta.View({
      name: "view1",
      templateName: "view1.html",
      el: "view1",
      region: "region1"
    });

    var view2 = sparta.regionManager.findView("view1");

    sparta.navManager.displayViewByName('view1', {}, function() {

      var t = $('#view1').length;

      if (t > 0) {
        ok(true, "View loaded into dom");
      } else {
        ok(false, "View not loaded into dom");
      }
      start();
    });

  });

  asyncTest("Show and View", function() {

    expect(1);

    var view = new sparta.View({
      name: "view2",
      templateName: "view2.html",
      el: "view2",
      region: "region1"
    });


    var view2 = sparta.regionManager.findView("view2");

    sparta.navManager.displayViewByName('view2', {}, function() {

      var t = $('#view2').length;

      if (t > 0) {
        ok(true, "View loaded into dom");
      } else {
        ok(false, "View not loaded into dom");
      }
      start();

    });

  });

});