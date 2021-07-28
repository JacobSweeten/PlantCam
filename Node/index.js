const NodeWebcam = require("node-webcam");
const ini = require("ini");
const http = require("http");
const fs = require("fs");
const AdmZip = require("adm-zip");

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
	verbose: false
};

var indexFile = fs.readFileSync("./displayImages.html");
var styleFile = fs.readFileSync("./displayImages.css");

try
{
	var configFile = fs.readFileSync("./config.ini", "utf-8");
}
catch(e)
{
	console.error("config.ini does not exist. Creating.");
	fs.writeFileSync("[PlantCam]\nInterval = 86400\nSetTime = 12:00\nMode = SetTime");
	process.exit(1);
}

try
{
	var config = ini.parse(configFile);
}
catch(e)
{
	console.error("Bad config file.");
	process.exit(1);
}

if(!fs.existsSync("./images"))
{
	fs.mkdirSync("./images");
}

var webcam = NodeWebcam.create(opts);

function takePicture()
{
	var dateTime = new Date().toISOString();
	var dateTime = dateTime.replace(/T/, '_').replace(/\..+/, '');
	
	webcam.capture("./images/" +  dateTime + ".jpeg", (err, data) => {
		if(err)
		{
			console.log(err);
			process.exit(1);
		}
	});
	
}

var doWait = false;

if(config.PlantCam.Mode == "Interval")
{
	setInterval(() => {
		takePicture();
	}, config.PlantCam.Interval * 1000);
}
else if(config.PlantCam.Mode == "SetTime")
{
	setInterval(() => {
		var time = new Date().toLocaleTimeString('en', {hour12: false}).split(":").slice(0, 2).join(":");
		if(time === config.PlantCam.SetTime)
		{
			if(!doWait)
			{
				takePicture();
				doWait = true;
				setTimeout(() => {doWait = false;}, 60000);
			}
		}
	}, 1000);
}

const httpServer = http.createServer((req, res) => {
	if(/^\/(index\.(htm|html))?$/.test(req.url))
	{
		res.writeHead(200);

		var insertString = "";
		var imgList = fs.readdirSync("./images");

		for(var i = 0; i < imgList.length; i++)
		{
			insertString = insertString + "<img src=\"/images/" + imgList[i] + "\">\n<br>\n";
		}

		var tempFile = indexFile.toString().replace(/<!--INSERT-->/, insertString);

		res.end(tempFile);
	}
	else if(req.url === "/displayImages.css")
	{
		res.writeHead(200);
		res.end(styleFile);
	}
	else if(req.url.startsWith("/images/"))
	{
		var imgString = req.url.split("/")[2];

		if(/(\.\.)/.test(req.url))
		{
			res.writeHead(404);
			res.end("Not found");
		}
		else if(fs.existsSync("./images/" + imgString))
		{
			res.writeHead(200);
			res.end(fs.readFileSync("./images/" + imgString));
		}
		else
		{
			res.writeHead(404);
			res.end("Not found");
		}
	}
	else if(req.url.split("?")[0] === "/download.zip")
	{
		res.writeHead(200);

		var zip = new AdmZip();

		var imgList = fs.readdirSync("./images");

		for(var i = 0; i < imgList.length; i++)
		{
			zip.addLocalFile("./images/" + imgList[i]);
		}

		zip.writeZip("./download.zip");

		zipFile = fs.readFileSync("./download.zip");
		res.end(zipFile);

		fs.rmSync("./download.zip");
	}
	else
	{
		res.writeHead(404);
		res.end("Not found");
	}
});

httpServer.listen(8080);