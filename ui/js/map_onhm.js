var Evacquide = function() {
    // ==================================================
    // この時間より古い報告は表示しない
    var threshold_millisec = 1000 * 60 * 60 * 24 * 365;

    // この時間が経過すると、人や軌跡のアイコンをグレーにする
    var gray_time_threshold_millisec = 2 * 60 * 1000;

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

    var route1v_cood = [[36.948068857805964,140.9049588464416],[36.948120333513614,140.9043203408177],[36.94796590628629,140.90429351285033],[36.94738680139588,140.90422912572856]];
    var route2v_cood = [[36.94816945043316,140.90366274118423],[36.94812336373498,140.90427562594417]];
    var route3v_cood = [[36.94912857277826,140.90445155630331],[36.94878111567551,140.90440058316526],[36.94854518710968,140.9043630240109]];
    var route4v_cood = [[36.94901293926355,140.90568244457248],[36.94851349211317,140.9055805206299]];
    var route5v_cood = [[36.9490767288521,140.90653002262118],[36.948405808953645,140.90637445449832]];
    var route6v_cood = [[36.94924765685764,140.90380892157557],[36.94917156127851,140.9044271707535]];
    var route7v_cood = [[36.94847448979887,140.90557024728],[36.94801120933171,140.90545220422348],[36.94806911954419,140.90502563954198]];

    var route1h_cood = [[36.947363709079426,140.9042288212875],[36.94812083444769,140.9043119879864],[36.948069358740376,140.9049934183581],[36.94763610349215,140.90495585920377],[36.947350840027944,140.9049236656429]];
    var route2h_cood = [[36.94815551724826,140.90363860130313],[36.94737739841628,140.90355545282367]];
    var route3h_cood = [[36.94855408693906,140.90436296112443],[36.949163210036595,140.9044568590103],[36.94909028710552,140.9050685366668]];
    var route4h_cood = [[36.949019369892206,140.9056743979454],[36.94907938906676,140.90511113405228]];
    var route5h_cood = [[36.94839723144282,140.90637177228928],[36.94908583604023,140.9065353870392],[36.94923170786624,140.90578973293307]];
    var route6h_cood = [[36.94922943679634,140.9037753939629],[36.94847705163496,140.90366542339328],[36.94818767074801,140.90364664793017]];
    var route7h_cood = [[36.94807355070178,140.90501205453057],[36.94800920602227,140.90544935039907],[36.94847892093287,140.90557275904902],[36.948502513842854,140.90508449004253]];


    // 現在選択されている道路の向き
    // "v"または "h"の値を持つ。
    var route1_direction;
    var route2_direction;
    var route3_direction;
    var route4_direction;
    var route5_direction;
    var route6_direction;
    var route7_direction;

    // 道路のオブジェクト
    var route1;
    var route2;
    var route3;
    var route4;
    var route5;
    var route6;
    var route7;


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

	// for Kawasaki test
	// map.setView([35.53063491789644,139.7006678581238], 17);


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
	var route = L.polyline(cood, {color:'red', weight:5, opacity:0.5}).arrowheads({fill:true, yawn:60, size:'10px', frequency:'30px'}).addTo(map);
	return route;
    }

    function drawBlueArrow(cood){
	var route = L.polyline(cood, {color:'blue', weight:5, opacity:0.5}).arrowheads({fill:true, yawn:60, size:'10px', frequency:'30px'}).addTo(map);
	return route;
    }

    function showBaseGuide(){
	// 1,2,3,4,5
	drawRedArrow([[36.95012540114057,140.90247988877186],[36.949482095715055,140.90235136019706]]);
	drawRedArrow([[36.95006504091139,140.90322317392597],[36.94938558046006,140.90308644650355]]);
	drawRedArrow([[36.94996852639505,140.90455384110845],[36.94920498502175,140.90446262601932]]);
	drawRedArrow([[36.94989989377566,140.90589523947796],[36.949247880807434,140.90575036845408],[36.94902794406289,140.90568512678146]]);
	drawRedArrow([[36.94979302461486,140.90672924544518],[36.94912846976559,140.90655416250232]]);

	// 6,7,8,9,10
	drawRedArrow([[36.94947153084759,140.90184426988498],[36.94933640943765,140.90307299079143],[36.94925087216212,140.90378612279895]]);
	drawRedArrow([[36.94909619300591,140.90182280751108],[36.94905115234061,140.9026008185654],[36.94903177405099,140.90298444556907]]);
	drawRedArrow([[36.949027580890004,140.90303008367533],[36.9487144401935,140.9030059385047],[36.94853213166088,140.90298447613077],[36.94824634815894,140.9029399732474]]);
	drawRedArrow([[36.94905115234061,140.90508508834566],[36.94850637266095,140.90503679800437],[36.94811387150067,140.9050019216468]]);
	drawRedArrow([[36.94854939908216,140.9017718896191],[36.948512937331536,140.90257672864078],[36.94848505480458,140.90295232018423]]);

	// 11,12,13,14,15
	drawRedArrow([[36.94849613702071,140.90434959886048],[36.94816369076916,140.90431203970613]]);
	drawRedArrow([[36.948234450985076,140.90175277445144],[36.94816367198414,140.90292247382968],[36.94821943726311,140.90293588781336],[36.94817439607944,140.9035985386079]]);
	drawRedArrow([[36.94835647599022,140.90636104345322],[36.947863491881165,140.90623809499124],[36.94756964992523,140.9061951702434],[36.94731870370787,140.90615761108904]]);
	drawRedArrow([[36.947386733769115,140.90167532304187],[36.94736957503853,140.90280746326573],[36.947326678195175,140.90416495841566]]);
	drawRedArrow([[36.94727091226266,140.90612876562858],[36.94730094007754,140.90491614150255],[36.94731380913744,140.9042776358787]]);
    }

    function showInitialGuide(){
	route_status = getRouteStatus();

	if (route_status["1"] == "v") {
	    route1_direction = "v";
	    route1 = drawRedArrow(route1v_cood);
	    $('#route1').removeClass("btn-primary");
	    $('#route1').addClass("btn-danger");
	} else {
	    route1_direction = "h";
	    route1 = drawBlueArrow(route1h_cood);
	    $('#route1').removeClass("btn-danger");
	    $('#route1').addClass("btn-primary");
	}
	if (route_status["2"] == "v") {
	    route2_direction = "v";
	    route2 = drawRedArrow(route2v_cood);
	    $('#route2').removeClass("btn-primary");
	    $('#route2').addClass("btn-danger");
	} else {
	    route2_direction = "h";
	    route2 = drawBlueArrow(route2h_cood);
	    $('#route2').removeClass("btn-danger");
	    $('#route2').addClass("btn-primary");
	}
	if (route_status["3"] == "v") {
	    route3_direction = "v";
	    route3 = drawRedArrow(route3v_cood);
	    $('#route3').removeClass("btn-primary");
	    $('#route3').addClass("btn-danger");
	} else {
	    route3_direction = "h";
	    route3 = drawBlueArrow(route3h_cood);
	    $('#route3').removeClass("btn-danger");
	    $('#route3').addClass("btn-primary");
	}
	if (route_status["4"] == "v") {
	    route4_direction = "v";
	    route4 = drawRedArrow(route4v_cood);
	    $('#route4').removeClass("btn-primary");
	    $('#route4').addClass("btn-danger");
	} else {
	    route4_direction = "h";
	    route4 = drawBlueArrow(route4h_cood);
	    $('#route4').removeClass("btn-danger");
	    $('#route4').addClass("btn-primary");
	}
	if (route_status["5"] == "v") {
	    route5_direction = "v";
	    route5 = drawRedArrow(route5v_cood);
	    $('#route5').removeClass("btn-primary");
	    $('#route5').addClass("btn-danger");
	} else {
	    route5_direction = "h";
	    route5 = drawBlueArrow(route5h_cood);
	    $('#route5').removeClass("btn-danger");
	    $('#route5').addClass("btn-primary");
	}
	if (route_status["6"] == "v") {
	    route6_direction = "v";
	    route6 = drawRedArrow(route6v_cood);
	    $('#route6').removeClass("btn-primary");
	    $('#route6').addClass("btn-danger");
	} else {
	    route6_direction = "h";
	    route6 = drawBlueArrow(route6h_cood);
	    $('#route6').removeClass("btn-danger");
	    $('#route6').addClass("btn-primary");
	}
	if (route_status["7"] == "v") {
	    route7_direction = "v";
	    route7 = drawRedArrow(route7v_cood);
	    $('#route7').removeClass("btn-primary");
	    $('#route7').addClass("btn-danger");
	} else {
	    route7_direction = "h";
	    route7 = drawBlueArrow(route7h_cood);
	    $('#route7').removeClass("btn-danger");
	    $('#route7').addClass("btn-primary");
	}

	var routeIntersection1 = L.divIcon({
	    html: '1',
	    className: 'divroute route1icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.94773537693773,140.90427160263064], {icon: routeIntersection1,zIndexOffset: 1800}).addTo(map);

	var routeIntersection2 = L.divIcon({
	    html: '2',
	    className: 'divroute route2icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.94815123011396,140.90394973754886], {icon: routeIntersection2,zIndexOffset: 1800}).addTo(map);

	var routeIntersection3 = L.divIcon({
	    html: '3',
	    className: 'divroute route3icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.948871465295866,140.90441107749942], {icon: routeIntersection3,zIndexOffset: 1800}).addTo(map);

	var routeIntersection4 = L.divIcon({
	    html: '4',
	    className: 'divroute route4icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.94871712975873,140.90562343597415], {icon: routeIntersection4,zIndexOffset: 1800}).addTo(map);

	var routeIntersection5 = L.divIcon({
	    html: '5',
	    className: 'divroute route5icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.94874196290273,140.90645492076877], {icon: routeIntersection5,zIndexOffset: 1800}).addTo(map);

	var routeIntersection6 = L.divIcon({
	    html: '6',
	    className: 'divroute route6icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.949205857886945,140.90410798788074], {icon: routeIntersection6,zIndexOffset: 1800}).addTo(map);

	var routeIntersection7 = L.divIcon({
	    html: '7',
	    className: 'divroute route7icon',
	    iconSize: [20,20],
	    iconAnchor: [10,10]
	});
	L.marker([36.948037620966446,140.9052237868309], {icon: routeIntersection7,zIndexOffset: 1800}).addTo(map);

    }


    function getAllReport(){
	var ret_data;
        $.ajax({
            type: 'POST',
            url: new Config().getUrl() + '/',
            async: false,
            data: JSON.stringify({
                mode: "getAllInfo"
	    }),
        }).done(function(data) {
	    ret_data = data.reports;
        });
	return ret_data;
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


    function getRouteStatus(){
	var ret_data;
        $.ajax({
            type: 'POST',
            url: new Config().getUrl() + '/',
            async: false,
            data: JSON.stringify({
                mode: "getRouteStatus"
	    }),
        }).done(function(data) {
	    ret_data = data.route_status;
        });
	return ret_data;
    }


    function getRouteHistory(time){
	var ret_data;
        $.ajax({
            type: 'POST',
            url: new Config().getUrl() + '/',
            async: false,
            data: JSON.stringify({
                mode: "getRouteHisoty",
		time: time
	    }),
        }).done(function(data) {
	    ret_data = data.route_history;
        });
	return ret_data;
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
	var active_sid_list = [];
	for (let sid in shown_trace_set) {
	    var max_time = 0;
	    var recent_time_list = [];
	    var old_time_list = [];
	    for (let time in shown_trace_set[sid]) {
		if (max_time < time) {
		    max_time = time;
		}
		if (trace_time_msec > (time * 1000 + gray_time_threshold_millisec)) {
		    old_time_list.push(time);
		} else {
		    recent_time_list.push(time);
		}
	    }
	    // console.log(sid + ":" + max_time);
	    if (trace_time_msec > (max_time * 1000 + gray_time_threshold_millisec)) {
		shown_trace_set[sid][max_time].setZIndexOffset(20);
		shown_trace_set[sid][max_time].setIcon(humanGrayIcon);
	    } else {
		active_sid_list.push(sid);
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
	$('#active_user_num').val(active_sid_list.length);
    }


    function removeTraces(){
	for (let sid in shown_trace_set) {
	    for (let time in shown_trace_set[sid]) {
		map.removeLayer(shown_trace_set[sid][time]);
	    }
	}
    }


    function highlight_user(e, target_sid){
	playback_time_str = $('#pb_starttime').val();
	playback_time_msec = Date.parse(playback_time_str);

	for (let sid in shown_history_set) {
	    if (sid == target_sid) {
		for (let time in shown_history_set[sid]) {
		    shown_history_set[sid][time].setZIndexOffset(100);
		    var current_icon = shown_history_set[sid][time].getIcon();
		    if (current_icon == humanGrayIcon) {
			shown_history_set[sid][time].setIcon(humanIcon);
		    }
		    if (current_icon == traceGrayIcon) {
			shown_history_set[sid][time].setIcon(traceIcon);
		    }
		}
	    } else {
		for (let time in shown_history_set[sid]) {
		    shown_history_set[sid][time].setZIndexOffset(10);
		    var current_icon = shown_history_set[sid][time].getIcon();
		    if (current_icon == humanIcon) {
			shown_history_set[sid][time].setIcon(humanGrayIcon);
		    }
		    if (current_icon == traceIcon) {
			shown_history_set[sid][time].setIcon(traceGrayIcon);
		    }
		}
	    }
	}
    }

    function put_history(sid, history){
	var tooltip_text = sid + "<br>updated at " + history.time;
	var history_mark = L.marker([Number(history.lat), Number(history.lon)], {
	    icon: humanIcon,
	    zIndexOffset: 1000
	}).bindTooltip(tooltip_text).addTo(map).on('click', (e) => {
            highlight_user(e, sid);
	});

	if (!(sid in shown_history_set)) {
	    shown_history_set[sid] = {}
	}
	shown_history_set[sid][history.stime] = history_mark;
    }


    function update_history_icon(playback_time_msec){
	var active_sid_list = [];
	for (let sid in shown_history_set) {
	    var max_time = 0;
	    var recent_time_list = [];
	    var old_time_list = [];
	    for (let time in shown_history_set[sid]) {
		if (max_time < time) {
		    max_time = time;
		}
		if (playback_time_msec > (time * 1000 + gray_time_threshold_millisec)) {
		    old_time_list.push(time);
		} else {
		    recent_time_list.push(time);
		}
	    }
	    // console.log(sid + ":" + max_time);
	    if (playback_time_msec > (max_time * 1000 + gray_time_threshold_millisec)) {
		shown_history_set[sid][max_time].setZIndexOffset(20);
		shown_history_set[sid][max_time].setIcon(humanGrayIcon)
	    } else {
		active_sid_list.push(sid);
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
	$('#active_user_num').val(active_sid_list.length);
    }


    function onHumanClick(e){
	map.removeLayer(e.target);
    }

    function report(anreport){
	if (anreport.table in marker_set) {
	} else {
	    var time_num = Date.parse(anreport.table);
	    if ((now_num - time_num) < threshold_millisec) {
		var report_detail = anreport.table + "<br><a href='" + anreport.URL + "' target='_blank'><img src='" + anreport.URL + "' width='300' height='600'></a>";
		var popup = L.popup({ maxWidth: 330, maxHeight: 660 }).setContent(report_detail);
		var tooltip_text = "report at " + anreport.table;
		var marker = L.marker([Number(anreport.lat), Number(anreport.lon)], {
		    zIndexOffset: 1500
		}).bindPopup(popup).bindTooltip(tooltip_text).addTo(map);
		marker_set[anreport.table] = marker;
	    } else {
	    }
	}
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

    function toggle_route7() {
	map.removeLayer(route7);
	if (route7_direction == "v") {
	    route7_direction = "h";
	    route7 = drawBlueArrow(route7h_cood);
	    $('#route7').removeClass("btn-danger");
	    $('#route7').addClass("btn-primary");
	    send_route("7h");
	} else {
	    route7_direction = "v";
	    route7 = drawRedArrow(route7v_cood);
	    $('#route7').removeClass("btn-primary");
	    $('#route7').addClass("btn-danger");
	    send_route("7v");
	}
    }

    function clearAllReport() {
	for (let marker_key in marker_set) {
	    map.removeLayer(marker_set[marker_key]);
	}
	marker_set = {};
    }

    function change_arrow(route_history) {
	// route_history.point // 1,2,3,4,5,6,7
	// route_history.action // h,v

	// console.log("change arrow");
	// console.log(route_history.point);
	// console.log(route_history.action);

	switch (route_history.point) {
	case "1":
	    map.removeLayer(route1);
	    if (route_history.action == "h") {
		route1 = drawBlueArrow(route1h_cood);
	    } else {
		route1 = drawRedArrow(route1v_cood);
	    }
	    route1_direction = route_history.action;
	    break;
	case "2":
	    map.removeLayer(route2);
	    if (route_history.action == "h") {
		route2 = drawBlueArrow(route2h_cood);
	    } else {
		route2 = drawRedArrow(route2v_cood);
	    }
	    route2_direction = route_history.action;
	    break;
	case "3":
	    map.removeLayer(route3);
	    if (route_history.action == "h") {
		route3 = drawBlueArrow(route3h_cood);
	    } else {
		route3 = drawRedArrow(route3v_cood);
	    }
	    route3_direction = route_history.action;
	    break;
	case "4":
	    map.removeLayer(route4);
	    if (route_history.action == "h") {
		route4 = drawBlueArrow(route4h_cood);
	    } else {
		route4 = drawRedArrow(route4v_cood);
	    }
	    route4_direction = route_history.action;
	    break;
	case "5":
	    map.removeLayer(route5);
	    if (route_history.action == "h") {
		route5 = drawBlueArrow(route5h_cood);
	    } else {
		route5 = drawRedArrow(route5v_cood);
	    }
	    route5_direction = route_history.action;
	    break;
	case "6":
	    map.removeLayer(route6);
	    if (route_history.action == "h") {
		route6 = drawBlueArrow(route6h_cood);
	    } else {
		route6 = drawRedArrow(route6v_cood);
	    }
	    route6_direction = route_history.action;
	    break;
	case "7":
	    map.removeLayer(route7);
	    if (route_history.action == "h") {
		route7 = drawBlueArrow(route7h_cood);
	    } else {
		route7 = drawRedArrow(route7v_cood);
	    }
	    route7_direction = route_history.action;
	    break;
	}
    }

    function setupControlls() {
	$(window).keyup(function(e) {
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
	    }
	    if (e.key == "Shift") {
		on_shift = true;
		// $('#map').css('cursor', 'pointer');
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

	$('.route7icon').on('click', function() {
	    toggle_route7()
	});

	$('#route7').on('click', function() {
	    toggle_route7()
	});


	$('#manual_update').on('click', function() {
	    updateAllInfo();
	});

	$('#clear_marker').on('click', function() {
	    clearAllReport();
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
		// 最初にすべてのReportを消す
		clearAllReport();

		playback_time_str = $('#pb_starttime').val();
		getAllTraces(playback_time_str);

		playback_time_str = $('#pb_starttime').val();
		playback_time_msec = Date.parse(playback_time_str);
		play_speed = Number($('#pb_playback_speed').val());

		var all_reports = getAllReport();
		// 過去の reportsは表示する
		if (all_reports.length > 0) {
		    while (Date.parse(all_reports[0].table) < playback_time_msec) {
			report(all_reports[0]);
			all_reports.shift();
			if (all_reports.length == 0) {
			    break;
			}
		    }
		}

		var route_history_list = getRouteHistory(playback_time_str);

		var pb_countUp = function() {

		    // reportの表示
		    if (all_reports.length > 0) {
			while (Date.parse(all_reports[0].table) < playback_time_msec) {
			    report(all_reports[0]);
			    all_reports.shift();
			    if (all_reports.length == 0) {
				break;
			    }
			}
		    }

		    // 矢印の表示
		    if (route_history_list.length > 0) {
			while (route_history_list[0].msec < playback_time_msec) {
			    change_arrow(route_history_list[0]);
			    route_history_list.shift();
			    if (route_history_list.length == 0) {
				break;
			    }
			}
		    }

		    for (let sid in trace_history) {
			// console.log(sid);
			// console.log(sid + ":" + trace_history[sid].length);

			if (trace_history[sid].length > 0) {
			    var stime = trace_history[sid][0].stime;

			    // traceの表示
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

	// for kawasaki
	// $('#pb_starttime').val("2024/1/24 13:09");

	// for Onahama 矢印の変化を見る
	$('#pb_starttime').val("2024/1/26 14:20:00");

	$('#pb_playback_speed').val(20);

    }

    return {
	main: main
    }
}();


$(function() {
    Evacquide.main();
});

$(window).on('load', function() {});

