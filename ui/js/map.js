var Evacquide = function() {
    var crossIcon;
    var map;
    var timer;
    var counter = 0;

    var on_get_coordinates = false;
    var on_auto_update = false;

    function main() {
	var on_shift = false;
	var on_control = false;


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
		putCross(lat, lng);
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

	// 最初にすべてを読み込む
	// updateAllInfo();
    }

    function putCross(lat, lng){
	// clickでバツを表示する
	// 再度クリックしたら消す
	L.marker([lat, lng], {icon: crossIcon}).on('click', onCrossClick).addTo(map);
    }

    function updateAllInfo(){
        $.ajax({
            type: 'POST',
            url: new Config().getUrl() + '/',
            async: false,
            data: JSON.stringify({
                mode: "getAllInfo"
	    }),
        }).done(function(data) {
	    data.reports.forEach(anreport => {
		report(anreport);
	    });
	    data.crosses.forEach(ancross => {
		putCross(ancross.lat, ancross.lng);
	    });
	    $('#result').html(data.html);
        });

    }

    function onCrossClick(e){
	map.removeLayer(e.target);
    }

    function report(anreport){
	var report_detail = anreport.time + "<br><img src='" + anreport.image_url + "' width='400'>";
	var popup = L.popup({ maxWidth: 550 }).setContent(report_detail);
	var tooltip_text = "report on " + anreport.time;
	var marker = L.marker([anreport.lat, anreport.lng]).bindPopup(popup).bindTooltip(tooltip_text).addTo(map);
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


	$('#manual_update').on('click', function() {
	    mon("updating...");
	    updateAllInfo();
	    mon("update done");
	});

	$('#get_coordinates').on('click', function() {
	    if (on_get_coordinates == false) {
	    } else {
	    }
	});

	$('#auto_update').on('click', function() {
	    if (on_auto_update == true) {
		clearTimeout(timer);　

		$('#auto_update').text("Auto update (stopped)");
		$('#auto_update').removeClass("btn-primary");
		$('#auto_update').addClass("btn-secondary");
		on_auto_update = false;

	    } else {

		var countUp = function() {
		    updateAllInfo();
		    $('#result').text("update:" + counter++);
		}
		// 2秒(2000)ごとに動かす
		timer = setInterval(countUp, 2000);

		$('#auto_update').text("Auto update (running)");
		$('#auto_update').removeClass("btn-secondary");
		$('#auto_update').addClass("btn-primary");
		on_auto_update = true;
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

