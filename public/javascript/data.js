const countEl = document.getElementById("count");
const avgEl = document.getElementById("avg");
const lenEl = document.getElementById("len");

async function getData() {
	const { count, avg } = await fetch("https://piebot.xyz/ctf/pixels/status").then(res => res.json());
	countEl.innerText = count;
	avgEl.innerText = avg.toFixed(2);

	const { len } = await fetch("/data/queue.json").then(res => res.json());
	lenEl.innerText = len;
}

setInterval(getData, 1000);


