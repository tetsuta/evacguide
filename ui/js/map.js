var Evacquide = function() {
    // ==================================================
    // この時間より古い報告は表示しない
    var threshold_millisec = 1000 * 60 * 60 * 24 * 365

    // 再生時の倍速の倍率
    var play_speed = "1.0";

    // ==================================================
    var now = new Date();
    var now_num = now.getTime();

    var humanIcon;
    var map;
    var timer;
    var counter = 0;

    var on_auto_update = false;
    var on_track_traces = false;
    var on_route1 = false;
    var on_route2 = false;

    var on_shift = false;
    var on_control = false;

    // 描画した markerを記録する
    var marker_set = {};

    var route1;
    var route2;

    var shown_trace_list = [];
    var trace_time_str = moment().format('YYYY/MM/DD HH:mm:ss');
    var trace_time_msec = Date.parse(trace_time_str);

    function main() {
	// ------------------------------
	var maplist = [];
	var overlaylist = [];

	maplist[0] = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
	    maxZoom: 24,
	    maxNativeZoom: 18,
	    attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>"
	});
	maplist[1] = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	    maxZoom: 24,
	    maxNativeZoom: 18,
	    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	});

	overlaylist[0] = L.tileLayer('https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png', {
	    opacity: 0.5,
	    attribution: '国土地理院：津波浸水想定'
	});
	overlaylist[1] = L.tileLayer('https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png', {
	    opacity: 0.5,
	    attribution: '土砂災害警戒区域（土石流）'
	});

	overlaylist[2] = L.tileLayer('https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png', {
	    opacity: 0.5,
	    attribution: '土砂災害警戒区域（急傾斜地の崩壊）'
	});

	overlaylist[3] = L.tileLayer('https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png', {
	    opacity: 0.5,
	    attribution: '国土地理院：洪水浸水想定区域'
	});

	var baseMaps = {
	    '国土地理院': maplist[0],
	    'OpenStreetMap': maplist[1]
	};

	var overlayLabel_wo_legend = {
	    'hz0': 'ハザードマップ 津波浸水想定',
	    'hz1': 'ハザードマップ 土砂災害警戒区域（土石流）',
	    'hz2': 'ハザードマップ 土砂災害警戒区域（急傾斜地の崩壊）',
	    'hz3': 'ハザードマップ 洪水浸水想定区域'
	}
	var overlayLabel_with_legend = {
	    'hz0': '<span id=hz0>ハザードマップ 津波浸水想定<br><img src=image/legend_tsunami.png /></span>',
	    'hz1': '<span id=hz1>ハザードマップ 土砂災害警戒区域（土石流）<br><img src=image/dosha_keikai_mini.png /></span>',
	    'hz2': '<span id=hz2>ハザードマップ 土砂災害警戒区域（急傾斜地の崩壊）<br><img src=image/dosha_keikai_mini.png /></span>',
	    'hz3': '<span id=hz3>ハザードマップ 洪水浸水想定区域<br><img src=image/shinsui_legend2-1.png /></span>'
	}

	var overlayMaps = {
	    '<span id=hz0></span>': overlaylist[0],
	    '<span id=hz1></span>': overlaylist[1],
	    '<span id=hz2></span>': overlaylist[2],
	    '<span id=hz3></span>': overlaylist[3]
	};


	// ------------------------------
	map = L.map('map', {
	    layers: [maplist[0], overlaylist[0]]  // default layer
	    // trackResize: true,
	});
	map.zoomControl.setPosition('bottomright');

	map.setView([33.5808303, 130.340], 18);

	L.control.layers(baseMaps, overlayMaps, {position: 'topright'}).addTo(map);

	var mapwidth = $('#maparea').width();
	var mapheight = (mapwidth * 3) / 4;
	$('#map').css('width', mapwidth);
	$('#map').css('height', mapheight);

	// ------------------------------
	setupControlls();


	// ------------------------------
	humanIcon = L.icon({
	    iconUrl: 'image/MapNoHito.png',
	    iconSize:     [24, 50], // size of the icon
	    iconAnchor:   [12, 25], // point of the icon which will correspond to marker's location
	});

	map.on('click', function(e) {
	    console.log(e);
	    lat = e.latlng.lat;
	    lon = e.latlng.lng;

	    if (on_shift == true) {
		// shift-clickで座標を表示する
		alert("lat: " + lat + ", lon: " + lon);

	    } else {
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


	map.on('overlayadd', function(e) {
	    console.log(e.name);
	    var target_name = e.name;
	    if (target_name.includes('hz0')) {
		$('#hz0').html(overlayLabel_with_legend['hz0']);
	    }
	    if (target_name.includes('hz1')) {
		$('#hz1').html(overlayLabel_with_legend['hz1']);
	    }
	    if (target_name.includes('hz2')) {
		$('#hz2').html(overlayLabel_with_legend['hz2']);
	    }
	    if (target_name.includes('hz3')) {
		$('#hz3').html(overlayLabel_with_legend['hz3']);
	    }
	});

	map.on('overlayremove', function(e) {
	    console.log(e.name);
	    var target_name = e.name;
	    if (target_name.includes('hz0')) {
		$('#hz0').html(overlayLabel_wo_legend['hz0']);
	    }
	    if (target_name.includes('hz1')) {
		$('#hz1').html(overlayLabel_wo_legend['hz1']);
	    }
	    if (target_name.includes('hz2')) {
		$('#hz2').html(overlayLabel_wo_legend['hz2']);
	    }
	    if (target_name.includes('hz3')) {
		$('#hz3').html(overlayLabel_wo_legend['hz3']);
	    }
	});


	// initial legend
	$('#hz0').html(overlayLabel_with_legend['hz0']);
	$('#hz1').html(overlayLabel_wo_legend['hz1']);
	$('#hz2').html(overlayLabel_wo_legend['hz2']);
	$('#hz3').html(overlayLabel_wo_legend['hz3']);


	// 最初にすべてを読み込む
	// updateAllInfo();
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


    function updateTraces(time){
        $.ajax({
            type: 'POST',
            url: new Config().getUrl() + '/',
            async: false,
            data: JSON.stringify({
                mode: "getTraces",
		time: time
	    }),
        }).done(function(data) {
	    removeTraces();
	    data.traces.forEach(antrace => {
		put_trace(antrace);
	    });
        });

    }

    function put_trace(trace){
	// var trace_mark = L.marker([Number(trace.lat), Number(trace.lon)], {icon: humanIcon}).on('click', onHumanClick).addTo(map);
	var tooltip_text = "updated on " + trace.time;
	var trace_mark = L.marker([Number(trace.lat), Number(trace.lon)], {icon: humanIcon}).bindTooltip(tooltip_text).addTo(map);
	shown_trace_list.push(trace_mark);
    }

    function removeTraces(){
	shown_trace_list.forEach(antrace => {
	    map.removeLayer(antrace);
	});
    }

    function onHumanClick(e){
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
	$('#monitor').text(text);
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

		// mon("sent route #" + route)
	    } else {
		// mon("sent nothing")
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
	    // mon("");
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
	    // mon("");
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


	$('#track_traces').on('click', function() {
	    // console.log("start");

	    if (on_track_traces == true) {
		clearTimeout(timer);　
		$('#track_traces').text("Track traces (stopped)");
		$('#track_traces').removeClass("btn-primary");
		$('#track_traces').addClass("btn-secondary");
		on_track_traces = false;

	    } else {
		trace_time_str = $('#starttime').val();
		// trace_time_str = "2023/12/13 13:23";
		play_speed = $('#playback_speed').val();
		trace_time_msec = Date.parse(trace_time_str);

		$('#starttime').val(trace_time_str);
		updateTraces(trace_time_str);

		var countUp = function() {
		    // 5秒ごとに更新
		    trace_time_msec += 5000 * Number(play_speed);
		    trace_time_str = moment(trace_time_msec).format('YYYY/MM/DD HH:mm:ss');
		    // console.log(trace_time_str);
		    $('#starttime').val(trace_time_str);
		    updateTraces(trace_time_str);
		}
		// 5秒(5000)ごとに動かす
		timer = setInterval(countUp, 5000);

		$('#track_traces').text("Track traces (running)");
		$('#track_traces').removeClass("btn-secondary");
		$('#track_traces').addClass("btn-primary");
		on_track_traces = true;
	    }
	});

	// 軌跡表示の初期値として今の時刻を設定
	$('#starttime').val(trace_time_str);
	// 初期の倍率を設定
	$('#playback_speed').val(play_speed);
    }

    return {
	main: main
    }
}();


$(function() {
    Evacquide.main();
});

$(window).on('load', function() {});

