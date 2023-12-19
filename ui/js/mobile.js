var Evacquide = function() {
    var map;

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

	map.setView([33.5808303, 130.340], 18);

	// 最初にすべてを読み込む
	updateAllInfo();
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
	    var report_detail = anreport.table + "<br><a href='" + anreport.URL + "' target='_blank'><img src='" + anreport.URL + "' width='300' height='600'></a>";
	    var popup = L.popup({ maxWidth: 330, maxHeight: 660 }).setContent(report_detail);
	    var tooltip_text = "report on " + anreport.table;
	    var marker = L.marker([Number(anreport.lat), Number(anreport.lon)]).bindPopup(popup).bindTooltip(tooltip_text).addTo(map);
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

