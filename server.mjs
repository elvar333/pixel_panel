import bodyParser from 'body-parser';
import favicon from 'serve-favicon';
import fetch from 'node-fetch';
import express from 'express';
import path from 'path';
import fs from 'fs';
import Jimp from 'jimp';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 1338;

const queue = [];
let drawData = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "draw.json"), "utf8"));
let doDraw = false;

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, "public", "images"));
	},
	filename: function(req, file, cb) {
		cb(null, "current" + path.extname(file.originalname));
	}
});
const upload = multer({ storage: storage });

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(favicon(path.join(__dirname, "public", "favicon.png")));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
	const { offsetX, offsetY } = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "offset.json"), "utf8"));
	const { count, avg } = await fetch("https://piebot.xyz/ctf/pixels/status").then(r => r.json());
	res.render("index.ejs", { count, avg, offsetX, offsetY, queue: queue.length, doDraw });
});

app.get("/queue", (req, res) => {
	if (doDraw) {
		const pixels = queue.splice(0, Math.min(15, queue.length));
		for (let i = 0; i < pixels.length; i++) {
			pixels[i] = JSON.parse(pixels[i]);
		}
		fs.writeFileSync(path.join(__dirname, "public", "data", "queue.json"), JSON.stringify({ len: queue.length }));
		res.json(pixels);
	} else {
		res.json([]);
	}
});

app.get("/toggle", (req, res) => {
	doDraw = !doDraw;
	res.json({ doDraw });
});

app.post("/upload", upload.single("image"), (req, res) => {
	parseImg(req.file.path, parseInt(req.body.x), parseInt(req.body.y));
	res.redirect("back");
});

app.listen(port, () => console.log(`Listening on port ${port}!`));

async function getData() {
	try{
		const pixelDataString = await fetch("http://challs.xmas.htsp.ro:3002/pixels.txt").then(r => r.text());
		for (const line of pixelDataString.split("\n").slice(0, -1)) {
			const [x, y, r, g, b, team] = line.split(" ");
			if (drawData[x+","+y] !== `${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')} ${team}`) {
				const data = JSON.stringify({ pos: {x: parseInt(x), y: parseInt(y)}, color: `${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`});
				if (queue.includes(data)) continue;
				queue.push(data);
			}
		}
		fs.writeFileSync(path.join(__dirname, "public", "data", "queue.json"), JSON.stringify({ len: queue.length }));
	
		const imageData = await fetch("http://challs.xmas.htsp.ro:3002/canvas.png");
		imageData.body.pipe(fs.createWriteStream(path.join(__dirname, "public", "images", "canvas.png")));
		console.log("Got data");
	} catch(e) {
		console.error(e);
	}
}

setInterval(getData, 15 * 1000);

function parseImg(imgPath, offsetX, offsetY) {
	drawData = {};
	Jimp.read(imgPath, (err, img) => {
		for (let x = 0; x < img.bitmap.width; x++) {
			for (let y = 0; y < img.bitmap.height; y++) {
				const pixel = img.getPixelColor(x, y);
				if (pixel != 0) {
					const r = Jimp.intToRGBA(pixel).r;
					const g = Jimp.intToRGBA(pixel).g;
					const b = Jimp.intToRGBA(pixel).b;
					if (x+offsetX >= 320 || y+offsetY >= 240) continue;
					drawData[(x+offsetX).toString()+','+(y+offsetY).toString()] = `${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')} 42`;
				}
			}
		}
		fs.writeFileSync(path.join(__dirname, "data", "draw.json"), JSON.stringify(pixelData));
		fs.writeFileSync(path.join(__dirname, "data", "offset.json"), JSON.stringify({ offsetX: offsetX, offsetY: offsetY }));
	});
}


