use image::{GenericImageView};
use std::fs;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Pos {
		x: u32,
		y: u32,
}

#[derive(Serialize, Deserialize)]
struct PixelData {
	pos: Pos,
	color: String
}

fn clamp_to_15bit(val: f32) -> i16 {
	return (((val / 255_f32) * 31_f32).floor() * 255_f32 / 31_f32).floor() as i16;
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
	let mut canvas = [[((-1,-1,-1), -1); 320]; 240];
	let res = reqwest::get("http://challs.xmas.htsp.ro:3002/pixels.txt").await?;
	let body = res.text().await?;
	for line in body.lines() {
		let mut parts = line.split(" ");
		let x = parts.next().unwrap().parse::<u32>().unwrap();
		let y = parts.next().unwrap().parse::<u32>().unwrap();
		let r = parts.next().unwrap().parse::<i16>().unwrap();
		let g = parts.next().unwrap().parse::<i16>().unwrap();
		let b = parts.next().unwrap().parse::<i16>().unwrap();
		let team = parts.next().unwrap().parse::<u32>().unwrap();
		canvas[y as usize][x as usize] = ((r, g, b), team as i16);
	}

	let img = image::open("./public/images/current.png").unwrap();

	let data = fs::read_to_string("./data/offset.json").expect("Unable to read file");
	let offsets: serde_json::Value = serde_json::from_str(&data).expect("Could not parse offset.json");
	let offset_x = offsets.get("offsetX").unwrap().as_u64().unwrap() as u32;
	let offset_y = offsets.get("offsetY").unwrap().as_u64().unwrap() as u32;
	
	let mut pixels: Vec<PixelData> = Vec::new();
	for pixel in img.pixels() {
		let index_y = pixel.1 as usize + offset_y as usize;
		let index_x = pixel.0 as usize + offset_x as usize;

		let r = clamp_to_15bit(pixel.2[0] as f32);
		let g = clamp_to_15bit(pixel.2[1] as f32);
		let b = clamp_to_15bit(pixel.2[2] as f32);
		let color_string = format!("{:02x}{:02x}{:02x}", pixel.2[0], pixel.2[1], pixel.2[2]).to_string();

		if pixel.2[3] == 0 {
			continue;
		}
		if index_x >= 320 || index_y >= 240 {
			continue;
		}

		if canvas[index_y][index_x].0 != (r, g, b) || canvas[index_y][index_x].1 != 42 {
			//println!("{} {} {:?} {} {:?}", index_x, index_y, canvas[index_y][index_x].0, canvas[index_y][index_x].1, (r, g, b));
			pixels.push(PixelData {
				pos: Pos{
					x: index_x as u32, 
					y: index_y as u32
				},
				color: color_string
			});
		}
	}
	println!("Wrote {}", pixels.len());

	fs::write("./data/queue.json", serde_json::to_string(&pixels).unwrap()).expect("Unable to write file");

	Ok(())
}