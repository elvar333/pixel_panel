import bodyParser from 'body-parser';
import favicon from 'serve-favicon';
import fetch from 'node-fetch';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import fileUpload from "./routes/upload.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 1338;

const queue = [];
let doDraw = false;

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
	}
	res.json({});
});

app.get("/toggle", (req, res) => {
	doDraw = !doDraw;
	res.json({ doDraw });
});


app.use("/upload", fileUpload);

app.listen(port, () => console.log(`Listening on port ${port}!`));

function findDiff() {
	const pixelData = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "pixels.json"), "utf8"));
	const drawData = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "draw.json"), "utf8"));
	
	for (const pos of Object.keys(drawData)) {
		if (pixelData[pos] !== drawData[pos]) {
			const [x, y] = pos.split(",");
			const data = JSON.stringify({ pos: {x: parseInt(x), y: parseInt(y)}, color: drawData[pos] });
			if (queue.includes(data)) continue;
			queue.push(data);
		}
	}
}

async function getData() {
	try{
		const pixelData = {}
		const pixelDataString = await fetch("http://challs.xmas.htsp.ro:3002/pixels.txt").then(r => r.text());
		for (const line of pixelDataString.split("\n").slice(0, -1)) {
			//console.log(line);
			const [x, y, r, g, b, team] = line.split(" ");
			pixelData[x+','+y] = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')} ${team}`;
		}
		fs.writeFileSync(path.join(__dirname, "data", "pixels.json"), JSON.stringify(pixelData));
		findDiff();
		fs.writeFileSync(path.join(__dirname, "public", "data", "queue.json"), JSON.stringify({ len: queue.length }));
	
		const imageData = await fetch("http://challs.xmas.htsp.ro:3002/canvas.png");
		imageData.body.pipe(fs.createWriteStream(path.join(__dirname, "public", "images", "canvas.png")));
		console.log("Got data");
	} catch(e) {
		console.error(e);
	}
}

setInterval(getData, 10 * 1000);
