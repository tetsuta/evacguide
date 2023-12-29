var Evacquide = function() {
    var now = new Date();
    var now_num = now.getTime();
    var threshold_millisec = 1000 * 60 * 60 * 24 * 3;
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
	map = L.map('map', {
	    // trackResize: true,
	});
	map.zoomControl.setPosition('bottomright');

	// 国土地理院
	L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
	    maxZoom: 24,
	    maxNativeZoom: 18,
            attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>"
	}).addTo(map);

	// open street map
	// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	//     maxZoom: 19,
	//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	// }).addTo(map);


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

