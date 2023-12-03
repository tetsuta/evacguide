var Evacquide = function() {
    function main() {
	// setupButtons();
	var map = L.map('map')
	map.setView([35.40, 136], 9);

	L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
            attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>"
	}).addTo(map);

	// open street map
	// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	// }).addTo(map);	

    }

    function setupButtons() {
    }

    return {
	main: main
    }
}();


$(function() {
    Evacquide.main();
});

$(window).on('load', function() {});

