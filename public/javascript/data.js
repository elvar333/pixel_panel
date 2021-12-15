const countEl = document.getElementById("count");
const avgEl = document.getElementById("avg");

async function getData() {
	const { count, avg } = await fetch("https://piebot.xyz/ctf/pixels/status").then(res => res.json());
	countEl.innerText = count;
	avgEl.innerText = avg.toFixed(2);
}

setInterval(getData, 1000);


