import requests
import json
from PIL import Image 

r = requests.get("http://challs.xmas.htsp.ro:3002/pixels.txt").text

with open("./data/offset.json", "r") as f:
	offsetData = json.loads(f.read())
	offsetX = offsetData["offsetX"]
	offsetY = offsetData["offsetY"]

lines = r.split("\n")

print(len(lines))
assert len(lines) > 76750

im = Image.open("./public/images/current.png")
pix = im.load()
width, height = im.size

ret = []

for y in range(height):
	for x in range(width):
		color = pix[x,y]
		if color[3] == 0: continue
		line = f"{x+offsetX} {y+offsetY} {color[0]} {color[1]} {color[2]} 42"
		if line in lines:
			continue
		else:
			ret.append({
				"pos": {
					"x": x+offsetX,
					"y": y+offsetY
				},
				"color": f"{color[0]:02x}{color[1]:02x}{color[2]:02x}"
			})

with open("./data/queue.json", "w") as f:
	f.write(json.dumps(ret))
