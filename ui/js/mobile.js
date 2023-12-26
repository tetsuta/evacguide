var Evacquide = function() {
    var now = new Date();
    var now_num = now.getTime();
    var threshold_millisec = 1000 * 60 * 60 * 24 * 3;
    var map = null;
    var current_location = null;

    // 描画した markerを記録する
    var marker_set = {};


    function main() {
	map = L.map('map', {
	    // trackResize: true,
	});


	// 国土地理院
	L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
	    maxZoom: 19,
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
	    map.setView([33.5808303, 130.340], 18);
	} else {
	    // console.log(lat_str);
	    // console.log(lon_str);
	    map.setView([Number(lat_str), Number(lon_str)], 18);
	}

	map.locate({setView: true, maxZoom: 16});
	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);

	// 最初にすべてを読み込む
	updateAllInfo();
    }

    function onLocationFound(e) {
	// console.log(e.latlng.lat);
	// console.log(e.latlng.lng);

	var pulsingIcon = L.icon.pulse({
	    iconSize:[20,20]
	    ,color:'#57c6fd'
	    ,fillColor:'#57c6fd'
	    ,heartbeat: 2
	});

	current_location = L.marker([e.latlng.lat, e.latlng.lng], {icon:pulsingIcon}).addTo(map).bindPopup("heartbeat:2sec");
	map.setView([e.latlng.lat, e.latlng.lng], 18);

	// 自動更新
	// var update_current_location = function() {
	//     map.removeLayer(current_location);
	// current_location = L.marker([e.latlng.lat, e.latlng.lng], {icon:pulsingIcon}).addTo(map).bindPopup("heartbeat:2sec");
	// map.setView([e.latlng.lat, e.latlng.lng], 18);
	// }
	// 5秒(5000)ごとに動かす
	// timer = setInterval(update_current_location, 5000);

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

