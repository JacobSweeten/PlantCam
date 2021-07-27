const NodeWebcam = require("node-webcam");
const ini = require("ini");

var opts = {
	width: 1280,
	height: 720,
	quality: 100,
	frames: 60,
	delay: 0,
	saveShots: true,
	output: "jpeg",
	device: false,
	callbackReturn: "location",
	verbose: true
};

var webcam = NodeWebcam.create(opts);

webcam.capture("Test", (err, data) => {
	// Nothing, I guess
});
