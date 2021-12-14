const multiplier = 1.5;
const canvasWidth = 320*multiplier;
const canvasHeight = 240*multiplier;

/* Preview */
const preview = document.getElementById('preview');
preview.width = canvasWidth;
preview.height = canvasHeight;
preview.style.width = `${canvasWidth}px`;
preview.style.height = `${canvasHeight}px`;

const x = document.getElementById('x');
const y = document.getElementById('y');
x.onchange = drawPreview;
y.onchange = drawPreview;

function drawPreview() {
	const ctx = preview.getContext('2d');
	const overlay = new Image();
	overlay.onload = () => {
		ctx.drawImage(overlay, x.value*multiplier, y.value*multiplier, overlay.width*multiplier, overlay.height*multiplier);
	};
	const background = new Image();
	background.onload = () => {
		ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);
		overlay.src = './images/current.png?r=' + performance.now();
	};
	background.src = './images/canvas.png?r=' + performance.now();


}

drawPreview()
setInterval(drawPreview, 10 * 1000);
/* Preview */
/* Live */
const live = document.getElementById('live');
live.width = canvasWidth;
live.height = canvasHeight;
live.style.width = `${canvasWidth}px`;
live.style.height = `${canvasHeight}px`;

function drawLive() {
	const ctx = live.getContext('2d');
	
	const background = new Image();
	background.onload = () => {
		ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);
	};
	background.src = './images/canvas.png?r=' + performance.now();
}

drawLive()
setInterval(drawLive, 5 * 1000);
/* Live */