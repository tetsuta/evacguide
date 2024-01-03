var Evacquide = function() {
    var now = new Date();
    var now_num = now.getTime();
    var threshold_millisec = 1000 * 60 * 60 * 24 * 365;
    var map = null;
    var current_location = null;

    // 描画した markerを記録する
    var marker_set = {};

    var current_lat = null;
    var current_lng = null;

    var pulsingIcon = L.icon.pulse({
	iconSize:[20,20],
	color:'#57c6fd',
	fillColor:'#57c6fd',
	heartbeat: 2
    });

    var first_location_found = true;

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
	    'hz1': '<span id=hz1>ハザードマップ 土砂災害警戒区域（土石流）<br><img src=image/dosha_keikai_tiny.png /></span>',
	    'hz2': '<span id=hz2>ハザードマップ 土砂災害警戒区域（急傾斜地の崩壊）<br><img src=image/dosha_keikai_tiny.png /></span>',
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

	map.locate({setView: true, maxZoom: 16});
	// console.log("go3");
	// console.log("go4");
	// console.log("go5");
	// console.log("go6");


	// initial legend
	$('#hz0').html(overlayLabel_with_legend['hz0']);
	$('#hz1').html(overlayLabel_wo_legend['hz1']);
	$('#hz2').html(overlayLabel_wo_legend['hz2']);
	$('#hz3').html(overlayLabel_wo_legend['hz3']);

	auto_update_current_location();
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
		var report_detail = anreport.table + "<br><a href='" + anreport.URL + "' target='_blank'><img src='" + anreport.URL + "' width='300' height='600'></a>";
		var popup = L.popup({ maxWidth: 330, maxHeight: 660 }).setContent(report_detail);
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

