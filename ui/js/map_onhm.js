var Evacquide = function() {
    // ==================================================
    // この時間より古い報告は表示しない
    var threshold_millisec = 1000 * 60 * 60 * 24 * 365

    // ==================================================
    var now = new Date();
    var now_num = now.getTime();

    var humanIcon;
    var humanGrayIcon;
    var traceIcon;
    var traceGrayIcon;

    var map;
    var auto_update_timer;
    var trace_playback_timer;
    var track_traces_timer;
    var counter = 0;

    var on_auto_update = false;
    var on_track_traces = false;
    var on_trace_playback = false;

    var route1v_cood = [[36.94847705163496,140.9029841423035],[36.94744384964621,140.90281248092654]];
    var route2v_cood = [[36.94924015447999,140.90378612279895],[36.94745028040733,140.90359032154086]];
    var route3v_cood = [[36.9491372646546,140.90445399284366],[36.94853278412399,140.90436279773715]];
    var route4v_cood = [[36.94803333382547,140.9050038456917],[36.947403121479915,140.90495824813846]];
    var route5v_cood = [[36.94847276451874,140.90558588504794],[36.94805262595792,140.90546786785129]];
    var route6v_cood = [[36.949062240736026,140.9065514802933],[36.94838487858288,140.90639591217044]];

    var route1h_cood = [[36.94847705163496,140.9029841423035],[36.94846204672712,140.9036493301392]];
    var route2h_cood = [[36.94815980438237,140.90365469455722],[36.94810835875745,140.9042823314667]];
    var route3h_cood = [[36.94914583881203,140.90445399284366],[36.949090106771536,140.90507090091708]];
    var route4h_cood = [[36.948061200237404,140.90500652790072],[36.94809978448323,140.90437889099124]];
    var route5h_cood = [[36.94847705163496,140.9055805206299],[36.948507061441816,140.9050762653351]];
    var route6h_cood = [[36.94908581968982,140.9065380692482],[36.949220862648325,140.90580582618716]];

    // 現在選択されている道路の向き
    // "v"または "h"の値を持つ。
    var route1_direction;
    var route2_direction;
    var route3_direction;
    var route4_direction;
    var route5_direction;
    var route6_direction;

    // 道路のオブジェクト
    var route1;
    var route2;
    var route3;
    var route4;
    var route5;
    var route6;


    var on_shift = false;
    var on_control = false;

    // 描画した markerを記録する
    var marker_set = {};

    var shown_trace_set = {};  // shown_trace_set[sid][time] = icon_marker
    var shown_history_set = {}; // shown_history_set[sid][time] = icon_marker
    var trace_history;
    var playback_time_str;

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
	    // 'hz1': '<span id=hz1>ハザードマップ 土砂災害警戒区域（土石流）<br><img src=image/dosha_keikai_mini.png /></span>',
	    // 'hz2': '<span id=hz2>ハザードマップ 土砂災害警戒区域（急傾斜地の崩壊）<br><img src=image/dosha_keikai_mini.png /></span>',
	    // 'hz3': '<span id=hz3>ハザードマップ 洪水浸水想定区域<br><img src=image/shinsui_legend2-1.png /></span>'
	}

	var overlayMaps = {
	    '<span id=hz0></span>': overlaylist[0],
	    // '<span id=hz1></span>': overlaylist[1],
	    // '<span id=hz2></span>': overlaylist[2],
	    // '<span id=hz3></span>': overlaylist[3]
	};


	// ------------------------------
	map = L.map('map', {
	    // layers: [maplist[0], overlaylist[0]]  // default layer; 国土地理院 & ハザードマップ
	    layers: [maplist[1]]  // default layer; 国土地理院

	    // trackResize: true,
	});
	map.zoomControl.setPosition('bottomright');

	map.setView([36.9485564412181, 140.904335975647], 17);

	L.control.layers(baseMaps, overlayMaps, {position: 'topright'}).addTo(map);

	var mapwidth = $('#maparea').width();
	var mapheight = (mapwidth * 3) / 4;
	$('#map').css('width', mapwidth);
	$('#map').css('height', mapheight);


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



	map.on('click', function(e) {
	    lat = e.latlng.lat;
	    lon = e.latlng.lng;

	    if (on_shift == true) {
		// shift-clickで座標を表示する
		console.log("[" + lat + "," + lon + "]")
		// alert("lat: " + lat + ", lon: " + lon);

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

	showBaseGuide();
	showInitialGuide();

	// 最初にすべてを読み込む
	// updateAllInfo();

	// ------------------------------
	setupControlls();
    }


    function drawRedArrow(cood){
	var route = L.polyline(cood, { color: 'red', weight: 5 }).arrowheads().addTo(map);
	return route;
    }

    function drawBlueArrow(cood){
	var route = L.polyline(cood, { color: 'blue', weight: 5 }).arrowheads().addTo(map);
	return route;
    }

    function showBaseGuide(){
	// 右
	drawRedArrow([[36.94945879489742,140.90186566114426],[36.94933018296315,140.9030619263649]]);
	drawRedArrow([[36.949090106771536,140.90185761451724],[36.94902151343497,140.9030082821846]]);
	drawRedArrow([[36.94854135834946,140.90179324150088],[36.94847276451874,140.90293586254123]]);
	drawRedArrow([[36.94823054205992,140.90176910161972],[36.94816623508303,140.90287953615191]]);
	drawRedArrow([[36.947422413771925,140.9017610549927],[36.9473924035378,140.90277493000033]]);
	drawRedArrow([[36.94737954200525,140.90284466743472],[36.94735381893368,140.9035259485245]]);
	drawRedArrow([[36.947349531754234,140.90362250804904],[36.94733667021446,140.90421259403232]]);

	// 左
	drawRedArrow([[36.94893577167738,140.90735077857974],[36.94907724552562,140.90656220912936]]);
	drawRedArrow([[36.948202675709915,140.90716838836673],[36.948335576672044,140.90643882751468]]);
	drawRedArrow([[36.94776967419281,140.90706110000613],[36.947885427314645,140.90633153915408]]);
	drawRedArrow([[36.9472766496668,140.90694040060046],[36.947295941990845,140.90618133544925]]);
	drawRedArrow([[36.947289511216695,140.90610623359683],[36.947310947128386,140.905414223671]]);
	drawRedArrow([[36.947310947128386,140.90528547763827],[36.947310947128386,140.9049850702286]]);
	drawRedArrow([[36.947310947128386,140.90490460395816],[36.94732380867251,140.90432524681094]]);




	// 下
	drawRedArrow([[36.950046119970466,140.9032362699509],[36.94941163721342,140.90311825275424]]);
	drawRedArrow([[36.949951805300465,140.90454518795016],[36.94921228849934,140.9044674038887]]);
	drawRedArrow([[36.94928516873485,140.90309947729114],[36.9490879632307,140.90306729078296]]);
	drawRedArrow([[36.949006508634334,140.90305387973788],[36.948528497010905,140.90298682451248]]);

	drawRedArrow([[36.94988964329501,140.9059023857117],[36.94928302519951,140.905779004097]]);
	drawRedArrow([[36.94981676363782,140.9067311882973],[36.94913083403593,140.90655952692032]]);
	drawRedArrow([[36.94919728373629,140.90576291084292],[36.94854350190568,140.90560734272006]]);
	drawRedArrow([[36.94904294885927,140.9050923585892],[36.94855636324169,140.90506017208102]]);
	drawRedArrow([[36.94846633384395,140.90505212545398],[36.948093353776976,140.9050226211548]]);
	drawRedArrow([[36.94831842817381,140.90637445449832],[36.94793901666334,140.9062832593918]]);
	drawRedArrow([[36.947844699384426,140.90625643730166],[36.94735167534397,140.90614378452304]]);
	drawRedArrow([[36.94844275469839,140.90434938669205],[36.94814694297939,140.90432792901996]]);
	drawRedArrow([[36.948071918085425,140.90431183576584],[36.94743098812237,140.90426087379458]]);
	drawRedArrow([[36.94798617525901,140.90548396110538],[36.94738168559415,140.90534985065463]]);
	drawRedArrow([[36.947246639375244,140.90393096208575],[36.947032279805974,140.90391218662265]]);

	// drawRedArrow([[36.94843632402106,140.90365737676623],[36.94818981431419,140.90365201234818]]);

    }


    function showInitialGuide(){
	route1_direction = "v";
	route2_direction = "v";
	route3_direction = "v";
	route4_direction = "v";
	route5_direction = "v";
	route6_direction = "v";

	route1 = drawRedArrow(route1v_cood);
	route2 = drawRedArrow(route2v_cood);
	route3 = drawRedArrow(route3v_cood);
	route4 = drawRedArrow(route4v_cood);
	route5 = drawRedArrow(route5v_cood);
	route6 = drawRedArrow(route6v_cood);

	var routeIntersection1 = L.divIcon({
	    html: '1',
	    className: 'divroute route1icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.94848086088772,140.90297877788547], {icon: routeIntersection1}).addTo(map);

	var routeIntersection2 = L.divIcon({
	    html: '2',
	    className: 'divroute route2icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.9481574165731,140.90364664793017], {icon: routeIntersection2}).addTo(map);

	var routeIntersection3 = L.divIcon({
	    html: '3',
	    className: 'divroute route3icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.94915256676398,140.90445667505264], {icon: routeIntersection3}).addTo(map);

	var routeIntersection4 = L.divIcon({
	    html: '4',
	    className: 'divroute route4icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.94806330436424,140.90501189231875], {icon: routeIntersection4}).addTo(map);

	var routeIntersection5 = L.divIcon({
	    html: '5',
	    className: 'divroute route5icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.94848079868966,140.90557783842087], {icon: routeIntersection5}).addTo(map);

	var routeIntersection6 = L.divIcon({
	    html: '6',
	    className: 'divroute route6icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.94908337729707,140.90655416250232], {icon: routeIntersection6}).addTo(map);

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


    function updateTraces(trace_time_str, trace_time_msec){
        $.ajax({
            type: 'POST',
            url: new Config().getUrl() + '/',
            async: false,
            data: JSON.stringify({
                mode: "getTraces",
		time: trace_time_str
	    }),
        }).done(function(data) {
	    data.traces.forEach(antrace => {
		put_trace(antrace);
	    });
	    update_trace_icon(trace_time_msec);
        });

    }

    function put_trace(trace){
	var tooltip_text = trace.sid + "<br>updated at " + trace.time;
	if (!(trace.sid in shown_trace_set)) {
	    shown_trace_set[trace.sid] = {}
	}
	if (!(trace.stime in shown_trace_set[trace.sid])) {
	    var trace_mark = L.marker([Number(trace.lat), Number(trace.lon)], {
		icon: humanIcon,
		zIndexOffset: 1000
	    }).bindTooltip(tooltip_text).addTo(map);
	    shown_trace_set[trace.sid][trace.stime] = trace_mark;
	}
    }

    function update_trace_icon(trace_time_msec){
	for (let sid in shown_trace_set) {
	    var max_time = 0;
	    var recent_time_list = [];
	    var old_time_list = [];
	    for (let time in shown_trace_set[sid]) {
		if (max_time < time) {
		    max_time = time;
		}
		if (trace_time_msec > (time * 1000 + 60 * 1000)) {
		    old_time_list.push(time);
		} else {
		    recent_time_list.push(time);
		}
	    }
	    // console.log(sid + ":" + max_time);
	    if (trace_time_msec > (max_time * 1000 + 60 * 1000)) {
		shown_trace_set[sid][max_time].setZIndexOffset(20);
		shown_trace_set[sid][max_time].setIcon(humanGrayIcon);
	    }
	    old_time_list.forEach(a_time => {
		if (a_time != max_time) {
		    shown_trace_set[sid][a_time].setZIndexOffset(10);
		    shown_trace_set[sid][a_time].setIcon(traceGrayIcon);
		}
	    })
	    recent_time_list.forEach(a_time => {
		if (a_time != max_time) {
		    shown_trace_set[sid][a_time].setZIndexOffset(500);
		    shown_trace_set[sid][a_time].setIcon(traceIcon);
		}
	    })
	}
    }


    function removeTraces(){
	for (let sid in shown_trace_set) {
	    for (let time in shown_trace_set[sid]) {
		map.removeLayer(shown_trace_set[sid][time]);
	    }
	}
    }


    function put_history(sid, history){
	var tooltip_text = sid + "<br>updated at " + history.time;
	var history_mark = L.marker([Number(history.lat), Number(history.lon)], {
	    icon: humanIcon,
	    zIndexOffset: 1000
	}).bindTooltip(tooltip_text).addTo(map);

	if (!(sid in shown_history_set)) {
	    shown_history_set[sid] = {}
	}
	shown_history_set[sid][history.stime] = history_mark;
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
		var tooltip_text = "report at " + anreport.table;
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

    function send_route(route){
	$.ajax({
	    type: 'POST',
	    url: new Config().getUrl() + '/',
	    async: false,
	    data: JSON.stringify({
		mode: "setOnahamaRoute",
		route: route
	    }),
	});
    }


    function toggle_route1() {
	map.removeLayer(route1);
	if (route1_direction == "v") {
	    route1_direction = "h";
	    route1 = drawBlueArrow(route1h_cood);
	    $('#route1').removeClass("btn-danger");
	    $('#route1').addClass("btn-primary");
	    send_route("1h");
	} else {
	    route1_direction = "v";
	    route1 = drawRedArrow(route1v_cood);
	    $('#route1').removeClass("btn-primary");
	    $('#route1').addClass("btn-danger");
	    send_route("1v");
	}
    }

    function toggle_route2() {
	map.removeLayer(route2);
	if (route2_direction == "v") {
	    route2_direction = "h";
	    route2 = drawBlueArrow(route2h_cood);
	    $('#route2').removeClass("btn-danger");
	    $('#route2').addClass("btn-primary");
	    send_route("2h");
	} else {
	    route2_direction = "v";
	    route2 = drawRedArrow(route2v_cood);
	    $('#route2').removeClass("btn-primary");
	    $('#route2').addClass("btn-danger");
	    send_route("2v");
	}
    }

    function toggle_route3() {
	map.removeLayer(route3);
	if (route3_direction == "v") {
	    route3_direction = "h";
	    route3 = drawBlueArrow(route3h_cood);
	    $('#route3').removeClass("btn-danger");
	    $('#route3').addClass("btn-primary");
	    send_route("3h");
	} else {
	    route3_direction = "v";
	    route3 = drawRedArrow(route3v_cood);
	    $('#route3').removeClass("btn-primary");
	    $('#route3').addClass("btn-danger");
	    send_route("3v");
	}
    }

    function toggle_route4() {
	map.removeLayer(route4);
	if (route4_direction == "v") {
	    route4_direction = "h";
	    route4 = drawBlueArrow(route4h_cood);
	    $('#route4').removeClass("btn-danger");
	    $('#route4').addClass("btn-primary");
	    send_route("4h");
	} else {
	    route4_direction = "v";
	    route4 = drawRedArrow(route4v_cood);
	    $('#route4').removeClass("btn-primary");
	    $('#route4').addClass("btn-danger");
	    send_route("4v");
	}
    }

    function toggle_route5() {
	map.removeLayer(route5);
	if (route5_direction == "v") {
	    route5_direction = "h";
	    route5 = drawBlueArrow(route5h_cood);
	    $('#route5').removeClass("btn-danger");
	    $('#route5').addClass("btn-primary");
	    send_route("5h");
	} else {
	    route5_direction = "v";
	    route5 = drawRedArrow(route5v_cood);
	    $('#route5').removeClass("btn-primary");
	    $('#route5').addClass("btn-danger");
	    send_route("5v");
	}
    }

    function toggle_route6() {
	map.removeLayer(route6);
	if (route6_direction == "v") {
	    route6_direction = "h";
	    route6 = drawBlueArrow(route6h_cood);
	    $('#route6').removeClass("btn-danger");
	    $('#route6').addClass("btn-primary");
	    send_route("6h");
	} else {
	    route6_direction = "v";
	    route6 = drawRedArrow(route6v_cood);
	    $('#route6').removeClass("btn-primary");
	    $('#route6').addClass("btn-danger");
	    send_route("6v");
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


	$('.route1icon').on('click', function() {
	    toggle_route1()
	});

	$('#route1').on('click', function() {
	    toggle_route1()
	});


	$('.route2icon').on('click', function() {
	    toggle_route2()
	});

	$('#route2').on('click', function() {
	    toggle_route2()
	});


	$('.route3icon').on('click', function() {
	    toggle_route3()
	});

	$('#route3').on('click', function() {
	    toggle_route3()
	});


	$('.route4icon').on('click', function() {
	    toggle_route4()
	});

	$('#route4').on('click', function() {
	    toggle_route4()
	});


	$('.route5icon').on('click', function() {
	    toggle_route5()
	});

	$('#route5').on('click', function() {
	    toggle_route5()
	});


	$('.route6icon').on('click', function() {
	    toggle_route6()
	});

	$('#route6').on('click', function() {
	    toggle_route6()
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
		clearTimeout(auto_update_timer);　
		stopPolling();

		$('#auto_update').text("Auto update (stopped)");
		$('#auto_update').removeClass("btn-primary");
		$('#auto_update').addClass("btn-secondary");
		on_auto_update = false;

	    } else {
		startPolling();
		var au_countUp = function() {
		    updateAllInfo();
		    $('#result').text("update:" + counter++);
		}
		// 1秒(1000)ごとに動かす
		auto_update_timer = setInterval(au_countUp, 1000);

		$('#auto_update').text("Auto update (running)");
		$('#auto_update').removeClass("btn-secondary");
		$('#auto_update').addClass("btn-primary");
		on_auto_update = true;
	    }
	});


	$('#trace_playback').on('click', function() {
	    var playback_time_str;
	    var playback_time_msec;
	    var interval_time;
	    var play_speed;

	    if (on_trace_playback == true) {
		clearTimeout(trace_playback_timer);　
		$('#trace_playback').text("Playback Trace (stopped)");
		$('#trace_playback').removeClass("btn-primary");
		$('#trace_playback').addClass("btn-secondary");
		on_trace_playback = false;

	    } else {
		playback_time_str = $('#pb_starttime').val();
		getAllTraces(playback_time_str);

		playback_time_str = $('#pb_starttime').val();
		playback_time_msec = Date.parse(playback_time_str);
		play_speed = Number($('#pb_playback_speed').val());

		var pb_countUp = function() {

		    for (let sid in trace_history) {
			// console.log(sid);
			// console.log(sid + ":" + trace_history[sid].length);

			if (trace_history[sid].length > 0) {
			    var stime = trace_history[sid][0].stime;
			    while (stime * 1000 < playback_time_msec) {
				ahistory = trace_history[sid].shift();
				put_history(sid, ahistory);
				if (trace_history[sid].length == 0) {
				    break;
				} else {
				    stime = trace_history[sid][0].stime;
				}
			    }
			}
		    }
		    update_history_icon(playback_time_msec);

		    playback_time_msec += 1000;
		    playback_time_str = moment(playback_time_msec).format('YYYY/MM/DD HH:mm:ss');

		    $('#pb_starttime').val(playback_time_str);
		}
		interval_time = Math.floor(1000.0 / play_speed);
		trace_playback_timer = setInterval(pb_countUp, interval_time);

		$('#trace_playback').text("Playback Trace (running)");
		$('#trace_playback').removeClass("btn-secondary");
		$('#trace_playback').addClass("btn-primary");
		on_trace_playback = true;
	    }
	});


	$('#track_traces').on('click', function() {
	    var trace_time_str;
	    var trace_time_msec;
	    var play_speed;

	    if (on_track_traces == true) {
		clearTimeout(track_traces_timer);　
		$('#track_traces').text("Track traces (stopped)");
		$('#track_traces').removeClass("btn-primary");
		$('#track_traces').addClass("btn-secondary");
		on_track_traces = false;

	    } else {
		trace_time_str = $('#starttime').val();
		play_speed = Number($('#playback_speed').val());
		trace_time_msec = Date.parse(trace_time_str);

		updateTraces(trace_time_str, trace_time_msec);

		var tt_countUp = function() {
		    // 5秒ごとに更新
		    trace_time_msec += 5000 * play_speed;
		    trace_time_str = moment(trace_time_msec).format('YYYY/MM/DD HH:mm:ss');
		    $('#starttime').val(trace_time_str);
		    updateTraces(trace_time_str, trace_time_msec);
		}
		// 5秒(5000)ごとに動かす
		track_traces_timer = setInterval(tt_countUp, 5000);

		$('#track_traces').text("Track traces (running)");
		$('#track_traces').removeClass("btn-secondary");
		$('#track_traces').addClass("btn-primary");
		on_track_traces = true;
	    }
	});

	// 軌跡表示の初期値として今の時刻を設定
	$('#starttime').val(moment().format('YYYY/MM/DD HH:mm:ss'));
	// $('#starttime').val("2023/12/13 13:23");

	// 初期の倍率を設定
	$('#playback_speed').val("1.0");

	$('#pb_starttime').val("2023/12/13 13:23");
	$('#pb_playback_speed').val(10);

    }

    return {
	main: main
    }
}();


$(function() {
    Evacquide.main();
});

$(window).on('load', function() {});

