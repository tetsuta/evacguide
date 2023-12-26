var Evacquide = function() {
    var now = new Date();
    var now_num = now.getTime();
    var threshold_millisec = 1000 * 60 * 60 * 24 * 10

    var crossIcon;
    var map;
    var timer;
    var counter = 0;

    var on_auto_update = false;

    var on_route1 = false;
    var on_route2 = false;

    var on_shift = false;
    var on_control = false;

    // 描画した markerを記録する
    var marker_set = {};

    var route1;
    var route2;

    function main() {
	setupControlls();
	map = L.map('map', {
	    // trackResize: true,
	});

	// 国土地理院
	L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
	    maxZoom: 24,
	    maxNativeZoom: 18,
            attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>"
	}).addTo(map);

	// open street map
	// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	    // maxZoom: 24,
	    // maxNativeZoom: 18,
	//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	// }).addTo(map);

	var mapwidth = $('#maparea').width();
	var mapheight = (mapwidth * 3) / 4;
	$('#map').css('width', mapwidth);
	$('#map').css('height', mapheight);

	map.setView([33.5808303, 130.340], 18);


	crossIcon = L.icon({
	    iconUrl: 'image/cross-sign.png',
	    iconSize:     [30, 30], // size of the icon
	    iconAnchor:   [15, 15], // point of the icon which will correspond to marker's location
	});

	map.on('click', function(e) {
	    lat = e.latlng.lat;
	    lon = e.latlng.lng;

	    if (on_shift == true) {
		// shift-clickで座標を表示する
		alert("lat: " + lat + ", lon: " + lon);

	    } else {
		// putCross(lat, lon);
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

    function putCross(lat, lon){
	// clickでバツを表示する
	// 再度クリックしたら消す
	L.marker([lat, lon], {icon: crossIcon}).on('click', onCrossClick).addTo(map);
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
	    // data.crosses.forEach(ancross => {
	    // 	putCross(ancross.lat, ancross.lon);
	    // });
	    // $('#result').html(data.html);
        });

    }

    function startPolling(){
        $.ajax({
            type: 'POST',
            url: new Config().getUrl() + '/',
            async: false,
            data: JSON.stringify({
                mode: "startPolling"
	    }),
        });
    }

    function stopPolling(){
        $.ajax({
            type: 'POST',
            url: new Config().getUrl() + '/',
            async: false,
            data: JSON.stringify({
                mode: "stopPolling"
	    }),
        });
    }


    function onCrossClick(e){
	map.removeLayer(e.target);
    }

    function report(anreport){
	if (anreport.table in marker_set) {
	} else {
	    var time_num = Date.parse(anreport.table);
	    if ((now_num - time_num) < threshold_millisec) {
		// mon("o:" + anreport.table)
		var report_detail = anreport.table + "<br><a href='" + anreport.URL + "' target='_blank'><img src='" + anreport.URL + "' width='300' height='600'></a>";
		var popup = L.popup({ maxWidth: 330, maxHeight: 660 }).setContent(report_detail);
		var tooltip_text = "report on " + anreport.table;
		var marker = L.marker([Number(anreport.lat), Number(anreport.lon)]).bindPopup(popup).bindTooltip(tooltip_text).addTo(map);
		marker_set[anreport.table] = marker;
	    } else {
		// mon("x:" + anreport.table)
	    }
	}
    }

    function mon(text){
	var tmp = $('#monitor').text();
	$('#monitor').text(tmp + "<br>" + text);
	// $('#monitor').text(text);
    }

    function showRoute(){
	if (on_route1 == true) {
	    var roadlatlons1 = [
		[33.581035924176796, 130.33912271261215],
		[33.580843751800764, 130.3397771716118],
		[33.58077224569113, 130.34064620733264],
		[33.580615825869785, 130.3406247496605],
		[33.58067392469367, 130.34054964780807],
		[33.580615825869785, 130.3406247496605],
		[33.58064710985673, 130.34069985151294]
	    ]
	    route1 = L.polyline(roadlatlons1, { color: 'red', weight: 5 }).addTo(map);
	} else {
	    if (route1 != null) {
		map.removeLayer(route1);
	    }
	}

	if (on_route2 == true) {
	    var roadlatlons2 = [
		[33.581035924176796, 130.33912271261215],
		[33.58087950483335, 130.33971279859546],
		[33.58072755434254, 130.33961087465286],
		[33.58064710985673, 130.34006148576736],
		[33.580615825869785, 130.3406247496605],
		[33.58066498641563, 130.3405925631523],
		[33.580615825869785, 130.3406247496605],
		[33.58057113444018, 130.34057646989825]
	    ]
	    route2 = L.polyline(roadlatlons2, { color: 'green', weight: 5 }).addTo(map);
	} else {
	    if (route2 != null) {
		map.removeLayer(route2);
	    }
	}
    }

    function setupControlls() {
	$(window).keyup(function(e) {
	    // mon(e.key);

	    if (e.key == "Control") {
		on_control = false;
	    }
	    if (e.key == "Shift") {
		on_shift = false;
		// $('#map').css('cursor', 'grab');
	    }
	});

	$(window).keydown(function(e) {
	    if (e.key == "Control") {
		on_control = true;
		// mon("control");
	    }
	    if (e.key == "Shift") {
		on_shift = true;
		// $('#map').css('cursor', 'pointer');
		// mon("shift");
	    }
	});


	$('#send_route').on('click', function() {
	    if ((on_route1 == true) || (on_route2 == true)){
		var route;
		if (on_route1 == true) {
		    route = "1";
		}
		if (on_route2 == true) {
		    route = "2";
		}
		$.ajax({
		    type: 'POST',
		    url: new Config().getUrl() + '/',
		    async: false,
		    data: JSON.stringify({
			mode: "selectRoute",
			route: route
		    }),
		});

		mon("sent route #" + route)
	    } else {
		mon("sent nothing")
	    }
	});


	$('#route1').on('click', function() {
	    if (on_route1 == false) {
		$('#route1').removeClass("btn-secondary");
		$('#route1').addClass("btn-primary");
		on_route1 = true;
		if (on_route2 == true) {
		    $('#route2').removeClass("btn-primary");
		    $('#route2').addClass("btn-secondary");
		    on_route2 = false;
		}
	    } else {
		$('#route1').removeClass("btn-primary");
		$('#route1').addClass("btn-secondary");
		on_route1 = false;
	    }
	    showRoute();
	    mon("");
	});

	$('#route2').on('click', function() {
	    if (on_route2 == false) {
		$('#route2').removeClass("btn-secondary");
		$('#route2').addClass("btn-primary");
		on_route2 = true;
		if (on_route1 == true) {
		    $('#route1').removeClass("btn-primary");
		    $('#route1').addClass("btn-secondary");
		    on_route1 = false;
		}
	    } else {
		$('#route2').removeClass("btn-primary");
		$('#route2').addClass("btn-secondary");
		on_route2 = false;
	    }
	    showRoute();
	    mon("");
	});

	$('#manual_update').on('click', function() {
	    updateAllInfo();
	    // mon("update done");
	});

	$('#clear_marker').on('click', function() {
	    for (let marker_key in marker_set) {
		map.removeLayer(marker_set[marker_key]);
	    }
	    marker_set = {};
	});

	$('#auto_update').on('click', function() {
	    if (on_auto_update == true) {
		clearTimeout(timer);　
		stopPolling();

		$('#auto_update').text("Auto update (stopped)");
		$('#auto_update').removeClass("btn-primary");
		$('#auto_update').addClass("btn-secondary");
		on_auto_update = false;

	    } else {
		startPolling();
		var countUp = function() {
		    updateAllInfo();
		    $('#result').text("update:" + counter++);
		}
		// 1秒(1000)ごとに動かす
		timer = setInterval(countUp, 1000);

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

