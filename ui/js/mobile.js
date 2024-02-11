var Evacquide = function() {
    var now = new Date();
    var now_num = now.getTime();
    var threshold_millisec = 1000 * 60 * 60 * 24 * 365;

    // この時刻以降の traceを表示する
    var show_trace_start_time = "2023/12/13 13:26:45";
    var map = null;
    var current_location = null;

    var humanIcon;
    var humanGrayIcon;
    var traceIcon;
    var traceGrayIcon;

    // 描画した markerを記録する
    var marker_set = {};

    var current_lat = null;
    var current_lng = null;

    // 対象となるユーザの sessionID
    var sid = null;

    var pulsingIcon = L.icon.pulse({
	iconSize:[20,20],
	color:'#57c6fd',
	fillColor:'#57c6fd',
	heartbeat: 2
    });

    var first_location_found = true;

    var shown_history_set = {}; // shown_history_set[sid][time] = icon_marker
    var trace_history;

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
	// overlaylist[1] = L.tileLayer('https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png', {
	//     opacity: 0.5,
	//     attribution: '土砂災害警戒区域（土石流）'
	// });

	// overlaylist[2] = L.tileLayer('https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png', {
	//     opacity: 0.5,
	//     attribution: '土砂災害警戒区域（急傾斜地の崩壊）'
	// });

	// overlaylist[3] = L.tileLayer('https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png', {
	//     opacity: 0.5,
	//     attribution: '国土地理院：洪水浸水想定区域'
	// });

	var baseMaps = {
	    '国土地理院': maplist[0],
	    'OpenStreetMap': maplist[1]
	};

	var overlayLabel_wo_legend = {
	    'hz0': 'ハザードマップ 津波浸水想定'
	    // 'hz1': 'ハザードマップ 土砂災害警戒区域（土石流）',
	    // 'hz2': 'ハザードマップ 土砂災害警戒区域（急傾斜地の崩壊）',
	    // 'hz3': 'ハザードマップ 洪水浸水想定区域'
	}
	var overlayLabel_with_legend = {
	    'hz0': '<span id=hz0>ハザードマップ 津波浸水想定<br><img src=image/legend_tsunami.png /></span>'
	    // 'hz1': '<span id=hz1>ハザードマップ 土砂災害警戒区域（土石流）<br><img src=image/dosha_keikai_tiny.png /></span>',
	    // 'hz2': '<span id=hz2>ハザードマップ 土砂災害警戒区域（急傾斜地の崩壊）<br><img src=image/dosha_keikai_tiny.png /></span>',
	    // 'hz3': '<span id=hz3>ハザードマップ 洪水浸水想定区域<br><img src=image/shinsui_legend2-1.png /></span>'
	}

	var overlayMaps = {
	    '<span id=hz0></span>': overlaylist[0]
	    // '<span id=hz1></span>': overlaylist[1],
	    // '<span id=hz2></span>': overlaylist[2],
	    // '<span id=hz3></span>': overlaylist[3]
	};


	// ------------------------------
	map = L.map('map', {
	    // layers: [maplist[0], overlaylist[0]]  // default layer
	    layers: [maplist[1]]  // default layer
	    // trackResize: true,
	});
	map.zoomControl.setPosition('bottomright');

	L.control.layers(baseMaps, overlayMaps, {position: 'topright'}).addTo(map);

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


	var param = location.search;
	var lat_str = getParam('lat');
	var lon_str = getParam('lon');
	sid = getParam('sid');
	if (lat_str == null || lon_str == null) {
	    console.log("default location");
	    map.setView([33.5808303, 130.340], 18);
	} else {
	    console.log("gived location");
	    // console.log(lat_str);
	    // console.log(lon_str);
	    map.setView([Number(lat_str), Number(lon_str)], 18);
	}

	L.easyButton('fas fa-map-marker-alt', function(btn, easyMap){
	    if ((current_lat != null) && (current_lng != null)) {
		map.setView([current_lat, current_lng], 18);
	    }
	}).setPosition('bottomright').addTo(map);

	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);

	// 最初にすべてを読み込む
	updateAllInfo();

	// for test あとでコメントを外す。そうしないと現在地に行かない
	map.locate({setView: true, maxZoom: 16});


	// initial legend
	$('#hz0').html(overlayLabel_with_legend['hz0']);
	$('#hz1').html(overlayLabel_wo_legend['hz1']);
	$('#hz2').html(overlayLabel_wo_legend['hz2']);
	$('#hz3').html(overlayLabel_wo_legend['hz3']);


	// ------------------------------
	humanIcon = L.icon({
	    iconUrl: 'image/MapNoHito2.png',
	    iconSize:     [24, 50], // size of the icon
	    iconAnchor:   [12, 25], // point of the icon which will correspond to marker's location
	});

	humanGrayIcon = L.icon({
	    iconUrl: 'image/MapNoHito2_gray.png',
	    iconSize:     [24, 50], // size of the icon
	    iconAnchor:   [12, 25], // point of the icon which will correspond to marker's location
	});

	traceIcon = L.icon({
	    iconUrl: 'image/trace.png',
	    iconSize:     [10, 10], // size of the icon
	    iconAnchor:   [5, 5], // point of the icon which will correspond to marker's location
	});

	traceGrayIcon = L.icon({
	    iconUrl: 'image/trace_gray.png',
	    iconSize:     [10, 10], // size of the icon
	    iconAnchor:   [5, 5], // point of the icon which will correspond to marker's location
	});


	// ------------------------------
	show_trace_history();
	auto_update_current_location();
    }


    function show_trace_history(){
	if (sid != null) {
	    getAllTraces(show_trace_start_time);

	    if (trace_history[sid].length > 0) {
		var stime = trace_history[sid][0].stime;
		while (stime * 1000 < now_num) {
		    ahistory = trace_history[sid].shift();
		    put_history(sid, ahistory);
		    if (trace_history[sid].length == 0) {
			break;
		    } else {
			stime = trace_history[sid][0].stime;
		    }
		}
	    }
	    update_history_icon(now_num);
	}
    }

    function put_history(asid, history){
	var tooltip_text = asid + "<br>updated at " + history.time;
	var history_mark = L.marker([Number(history.lat), Number(history.lon)], {
	    icon: humanIcon,
	    zIndexOffset: 1000
	}).bindTooltip(tooltip_text).addTo(map);

	if (!(asid in shown_history_set)) {
	    shown_history_set[asid] = {}
	}
	shown_history_set[asid][history.stime] = history_mark;
    }


    function update_history_icon(playback_time_msec){
	for (let sid in shown_history_set) {
	    var max_time = 0;
	    var recent_time_list = [];
	    var old_time_list = [];
	    for (let time in shown_history_set[sid]) {
		if (max_time < time) {
		    max_time = time;
		}
		if (playback_time_msec > (time * 1000 + 60 * 1000)) {
		    old_time_list.push(time);
		} else {
		    recent_time_list.push(time);
		}
	    }
	    // console.log(sid + ":" + max_time);
	    if (playback_time_msec > (max_time * 1000 + 60 * 1000)) {
		shown_history_set[sid][max_time].setZIndexOffset(20);
		shown_history_set[sid][max_time].setIcon(humanGrayIcon)
	    }
	    old_time_list.forEach(a_time => {
		if (a_time != max_time) {
		    shown_history_set[sid][a_time].setZIndexOffset(10);
		    shown_history_set[sid][a_time].setIcon(traceGrayIcon)
		}
	    })
	    recent_time_list.forEach(a_time => {
		if (a_time != max_time) {
		    shown_history_set[sid][a_time].setZIndexOffset(500);
		    shown_history_set[sid][a_time].setIcon(traceIcon)
		}
	    })
	}
    }


    function getAllTraces(time){
        $.ajax({
            type: 'POST',
            url: new Config().getUrl() + '/',
            async: false,
            data: JSON.stringify({
                mode: "getAllTraces",
		time: time
	    }),
        }).done(function(data) {
	    trace_history = data.trace_history;
        });
    }


    function auto_update_current_location() {
	var update_current_location = function() {
	    // console.log("update current location")
	    map.removeLayer(current_location);
	    map.locate();

	    current_location = L.marker([current_lat, current_lng], {icon:pulsingIcon}).addTo(map).bindPopup("heartbeat:2sec");
	}
	timer = setInterval(update_current_location, 10000);
    }

    function onLocationFound(e) {
	current_lat = e.latlng.lat;
	current_lng = e.latlng.lng;
	// console.log("get current location");
	// console.log(current_lat);
	// console.log(current_lng);
	if (first_location_found == true) {
	    current_location = L.marker([current_lat, current_lng], {icon:pulsingIcon}).addTo(map).bindPopup("heartbeat:2sec");
	    map.setView([current_lat, current_lng], 18);
	    first_location_found = false;
	}
    }

    function onLocationError(e) {
	alert(e.message);
    }

    function getParam(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
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

    function report(anreport){
	if (anreport.table in marker_set) {
	} else {
	    var time_num = Date.parse(anreport.table);
	    if ((now_num - time_num) < threshold_millisec) {
		var report_detail = anreport.table + "<br><a href='" + anreport.URL + "' target='_blank'><img src='" + anreport.URL + "' width='200' height='400'></a>";
		var popup = L.popup({ maxWidth: 200, maxHeight: 400 }).setContent(report_detail);
		var tooltip_text = "report on " + anreport.table;
		var marker = L.marker([Number(anreport.lat), Number(anreport.lon)]).bindPopup(popup).bindTooltip(tooltip_text).addTo(map);
	    } else {
	    }
	    marker_set[anreport.table] = marker;
	}
    }


    return {
	main: main
    }
}();


$(function() {
    Evacquide.main();
});

$(window).on('load', function() {});

