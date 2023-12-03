var Evacquide = function() {
    var map;

    function main() {
	var on_shit;
	var on_control;
	on_shift = false;
	on_control = false;


	setupControlls();
	map = L.map('map');

	L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
            attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>"
	}).addTo(map);

	map.setView([36.948, 140.903], 15);
	// open street map
	// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	// }).addTo(map);	


	map.on('click', function(e) {
	    lat = e.latlng.lat;
	    lng = e.latlng.lng;

	    // shift-clickで座標を表示する
	    if (on_shift == true) {
		alert("lat: " + lat + ", lng: " + lng);
		return;
	    } 

	    // clickでマーカーを載せる
	    var report_detail = "timestamp<br><img src='https://cdn.mainichi.jp/vol1/2022/11/29/20221129k0000m040094000p/9.jpg?1' width='500' height='375'>";
	    var popup1 = L.popup({ maxWidth: 550 }).setContent(report_detail);
	    var marker = L.marker([lat, lng]).bindPopup(popup1).bindTooltip("report on timestamp").addTo(map);

	});

	map.on('move', function(e) {
	});
    }

    function setupControlls() {
	$(window).keyup(function(e) {
	    if (e.key == "Control") {
		on_control = false;
	    }
	    if (e.key == "Shift") {
		on_shift = false;
	    }
	});

	$(window).keydown(function(e) {
	    if (e.key == "Control") {
		on_control = true;
	    }
	    if (e.key == "Shift") {
		on_shift = true;
	    }
	});

    }

    return {
	main: main
    }
}();


$(function() {
    Evacquide.main();
});

$(window).on('load', function() {});

