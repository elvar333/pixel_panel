import multer from 'multer';
import path from 'path';
import Jimp from 'jimp';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from "express";
const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, "../public/images"));
	},
	filename: function(req, file, cb) {
		cb(null, "current" + path.extname(file.originalname));
	}
});
const upload = multer({ storage: storage });

function parseImg(imgPath, offsetX, offsetY) {
	const pixelData = {};
	Jimp.read(imgPath, (err, img) => {
		for (let x = 0; x < img.bitmap.width; x++) {
			for (let y = 0; y < img.bitmap.height; y++) {
				const pixel = img.getPixelColor(x, y);
				if (pixel != 0) {
					const r = Jimp.intToRGBA(pixel).r;
					const g = Jimp.intToRGBA(pixel).g;
					const b = Jimp.intToRGBA(pixel).b;
					if (x+offsetX >= 320 || y+offsetY >= 240) continue;
					pixelData[(x+offsetX).toString()+','+(y+offsetY).toString()] = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')} 42`;
				}
			}
		}
		fs.writeFileSync(path.join(__dirname, "../data/draw.json"), JSON.stringify(pixelData));
		fs.writeFileSync(path.join(__dirname, "../data/offset.json"), JSON.stringify({ offsetX: offsetX, offsetY: offsetY }));
	});
}


router.post("/", upload.single("image"), (req, res) => {
	parseImg(req.file.path, parseInt(req.body.x), parseInt(req.body.y));
	res.redirect("back");
});

export default router;