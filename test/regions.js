$(document).ready(function() {
	module("regions");

	test("Create Region", function() {

		var regionName = "region1";

		var region = new sparta.Region({
			name: regionName,
			el: "region1"
		});

		var region2 = sparta.regionManager.find(region.name);

		var region2Name = region2 ? region2.name : "Unknown";


		equal(region2Name, regionName, "Region created");
	});

	test("Remove Region", function() {

		var regionName = "region2";

		var region = new sparta.Region({
			name: regionName,
			el: "region2"
		});

		sparta.regionManager.remove(region);

		var region2 = sparta.regionManager.find(region.name);

		var region2Name = region2 ? region2.name : "Unknown";


		equal(region2Name, "Unknown", "Region created");
	});

	module("Region Functions", {
		setup: function() {
			var regionName = "region100";

			var region = new sparta.Region({
				name: regionName,
				el: "region100"
			});

		}
	});

	test("Find 1 sibling view", function() {
		var view = new sparta.View({
			name: "view1",
			templateName: "template1",
			el: "view1",
			region: "region100"
		});

		var view2 = new sparta.View({
			name: "view2",
			templateName: "template1",
			el: "view2",
			region: "region100"
		});

		var views = sparta.regionManager.findSiblingViews(view);

		equal(views[0].name, "view2", "Sibling Views Found");


		var view3 = new sparta.View({
			name: "view3",
			templateName: "template1",
			el: "view3",
			region: "region100"
		});

		var view4 = new sparta.View({
			name: "view4",
			templateName: "template1",
			el: "view4",
			region: "region100"
		});


		var view5 = new sparta.View({
			name: "view5",
			templateName: "template1",
			el: "view5",
			region: "region100"
		});

		views = sparta.regionManager.findSiblingViews(view3);

		equal(views.length, 4, "Sibling Views Found");
	});
});