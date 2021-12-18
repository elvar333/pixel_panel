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
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
	let mut canvas = [[-1; 320]; 240];
	let res = reqwest::get("http://challs.xmas.htsp.ro:3002/pixels.txt").await?;
	let body = res.text().await?;
	for line in body.lines() {
		let mut parts = line.split(" ");
		let x = parts.next().unwrap().parse::<u32>().unwrap();
		let y = parts.next().unwrap().parse::<u32>().unwrap();
		let r = parts.next().unwrap().parse::<u32>().unwrap();
		let g = parts.next().unwrap().parse::<u32>().unwrap();
		let b = parts.next().unwrap().parse::<u32>().unwrap();
		let team = parts.next().unwrap().parse::<u32>().unwrap();
		let color_string = format!("{:02x}{:02x}{:02x}", r, g, b).to_string();
		let color_value = i32::from_str_radix(&color_string, 16).unwrap();
		if team == 42 {
			canvas[y as usize][x as usize] = color_value;
		}
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
		let color_string = format!("{:02x}{:02x}{:02x}", pixel.2[0], pixel.2[1], pixel.2[2]);
		if pixel.2[3] == 0 {
			continue;
		}
		if index_x >= 320 || index_y >= 240 {
			continue;
		}
		if canvas[index_y][index_x] == -1 || (canvas[index_y][index_x] != i32::from_str_radix(&color_string, 16).unwrap() && canvas[index_y][index_x] != -1) {
			pixels.push(PixelData {
				pos: Pos{
					x: index_x as u32, 
					y: index_y as u32
				},
				color: format!("{:02x}{:02x}{:02x}", pixel.2[0], pixel.2[1], pixel.2[2])
			});
		}
	}
	println!("Wrote {}", pixels.len());

	fs::write("./data/queue.json", serde_json::to_string(&pixels).unwrap()).expect("Unable to write file");

	Ok(())
}