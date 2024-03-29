import bodyParser from 'body-parser';
import favicon from 'serve-favicon';
import fetch from 'node-fetch';
import express from 'express';
import path from 'path';
import fs from 'fs';
import {spawn} from 'child_process';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 1338;

let queue = [];
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
	try {
		const { count, avg } = await fetch("localhost:13337/status").then(r => r.json());
		res.render("index.ejs", { count, avg, offsetX, offsetY, queue: queue.length, doDraw });
	} catch (e) {
		const count = 0;
		const avg = 0;
		res.render("index.ejs", { count, avg, offsetX, offsetY, queue: queue.length, doDraw });
	}
});

app.get("/queue", (req, res) => {
	if (doDraw) {
		const pixels = [];
		for (let i = 0; i < 15; i++) {
			pixels.push(queue.splice(Math.floor(Math.random() * queue.length), 1)[0]);
		}
		res.json(pixels);
	} else {
		res.json([]);
	}
});

app.get("/stats", (req, res) => {
	res.json({
		"queue": queue.length,
		"doDraw": doDraw
	})
});

app.get("/toggle", (req, res) => {
	doDraw = !doDraw;
	if (doDraw && fs.existsSync(path.join(__dirname, "frames"))) {
		totalFrames = fs.readdirSync(path.join(__dirname, "frames")).length;
	
		animateInt =  setInterval(updateFrame, 90 * 1000);
	} else {
		clearInterval(animateInt);
	}

	res.json({ doDraw });
});

app.post("/upload", upload.single("image"), (req, res) => {
	const { x, y } = req.body;
	fs.writeFileSync(path.join(__dirname, "data", "offset.json"), JSON.stringify({ offsetX: parseInt(x), offsetY: parseInt(y) }));
	res.redirect("back");
});

app.listen(port, () => console.log(`Listening on port ${port}!`));

async function getData() {
	try{
		const diff = spawn(path.join(__dirname, "diff"));
		diff.on('close', (code) => {
			console.log(`child process exited with code ${code}`);

			try {
				queue = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "queue.json"), "utf8"));
			} catch (e) {
				console.log(`[Error] ${e}`);
			}
		});

	
		const imageData = await fetch("http://challs.xmas.htsp.ro:3002/canvas.png");
		imageData.body.pipe(fs.createWriteStream(path.join(__dirname, "public", "images", "canvas.png")));
		console.log("Got data");
	} catch(e) {
		console.error(e);
	}
}

setInterval(getData, 7 * 1000);

let currFrame = 1;
let totalFrames = 0;
let animateInt;

function updateFrame() {
	if (currFrame > totalFrames) {
		currFrame = 1;
	}
	fs.copyFileSync(path.join(__dirname, "frames", `${String(currFrame).padStart(4, '0')}.png`), path.join(__dirname, "public", "images", "current.png") );
	currFrame++;
}
