var Evacquide = function() {
    var crossIcon;
    var map;

    function main() {
	var on_shit;
	var on_control;
	on_shift = false;
	on_control = false;


	setupControlls();
	map = L.map('map', {
	    // trackResize: true,
	});

	L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
            attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>"
	}).addTo(map);

	var mapwidth = $('#maparea').width();
	var mapheight = (mapwidth * 3) / 4;
	$('#map').css('width', mapwidth);
	$('#map').css('height', mapheight);


	map.setView([36.948, 140.903], 15);
	// open street map
	// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	// }).addTo(map);

	crossIcon = L.icon({
	    iconUrl: 'image/cross-sign.png',
	    iconSize:     [30, 30], // size of the icon
	    iconAnchor:   [15, 15], // point of the icon which will correspond to marker's location
	});


	map.on('click', function(e) {
	    lat = e.latlng.lat;
	    lng = e.latlng.lng;

	    if (on_shift == true) {
		// shift-clickで座標を表示する
		alert("lat: " + lat + ", lng: " + lng);

	    } else {
		// clickでバツを表示する
		// 再度クリックしたら消す
		L.marker([lat, lng], {icon: crossIcon}).on('click', onCrossClick).addTo(map);
	    }
	});


	$(window).resize(function(){
	    var mapwidth = $('#maparea').width();
	    var mapheight = (mapwidth * 3) / 4;
	    $('#map').css('width', mapwidth);
	    $('#map').css('height', mapheight);
	});

	map.on('move', function(e) {
	});

	report(36.94891755154147, 140.90274810791018);
	report(36.94812872265479, 140.90515136718753);
	report(36.947511372610805, 140.90772628784183);

    }

    function onCrossClick(e){
	map.removeLayer(e.target);
    }

    function report(lat, lng){
	var report_detail = "timestamp<br><img src='https://cdn.mainichi.jp/vol1/2022/11/29/20221129k0000m040094000p/9.jpg?1' width='400'>";
	var popup = L.popup({ maxWidth: 550 }).setContent(report_detail);
	var marker = L.marker([lat, lng]).bindPopup(popup).bindTooltip("report on timestamp").addTo(map);
    }


    function mon(text){
	$('#monitor').text(text);
    }

    function setupControlls() {
	$(window).keyup(function(e) {
	    // mon(e.key);

	    if (e.key == "Control") {
		on_control = false;
	    }
	    if (e.key == "Shift") {
		on_shift = false;
		$('#map').css('cursor', 'grab');
	    }
	    if (e.key == "a") {
	    }
	    if (e.key == "b") {
	    }
	});

	$(window).keydown(function(e) {
	    if (e.key == "Control") {
		on_control = true;
		// mon("control");
	    }
	    if (e.key == "Shift") {
		on_shift = true;
		$('#map').css('cursor', 'pointer');
		// mon("shift");
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

