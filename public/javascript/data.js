const countEl = document.getElementById("count");
const avgEl = document.getElementById("avg");
const lenEl = document.getElementById("len");
const drawEl = document.getElementById("draw");

async function getData() {
	const { count, avg } = await fetch("https://piebot.xyz/ctf/pixels/status").then(res => res.json());
	const { queue, doDraw } = await fetch("/stats").then(res => res.json());
	countEl.innerText = count;
	avgEl.innerText = avg.toFixed(2);
	lenEl.innerText = queue;
	if (doDraw) {
		drawEl.checked = true;
	}
	else {
		drawEl.checked = false;
	}
}

setInterval(getData, 1000);


