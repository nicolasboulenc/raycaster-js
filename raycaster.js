"use strict"

window.addEventListener("load", window_on_load)


let scale = 2
let canvas = null
let ctx = null
let cto = null
let player = { x: 300, y: 300 }
let input = { up: false, down: false, left: false, right: false }
let timeprev = 0

let mapx = 8
let mapy = 8
let maps = 64
let map = [
	1, 1, 1, 1, 1, 1, 1, 1,
	1, 0, 1, 0, 0, 0, 0, 1,
	1, 0, 1, 0, 0, 0, 0, 1,
	1, 0, 1, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 1, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 1,
	1, 1, 1, 1, 1, 1, 1, 1
]


function window_on_load(evt) {
	
	canvas = document.querySelector("canvas")
	canvas.width = canvas.clientWidth
	canvas.height = canvas.clientHeight
	canvas.addEventListener("mousemove", canvas_on_mousemove)
	canvas.addEventListener("mousedown", canvas_on_mousedown)
	canvas.addEventListener("mouseup", canvas_on_mouseup)
	window.addEventListener("keydown", window_onkeydown)
	window.addEventListener("keyup", window_onkeyup)

	ctx = canvas.getContext("2d")
	ctx.imageSmoothingEnabled = false

	cto = new OffscreenCanvas(canvas.width/scale, canvas.height/scale).getContext("2d")

	timeprev = Date.now()
	loop()
}


function loop(timestamp) {
	
	window.requestAnimationFrame(loop)
	let elapsed = timestamp - timeprev
	timeprev = timestamp




	if(input.up === true) {
		player.y -= 10 * elapsed / 100
	}
	if(input.down === true) {
		player.y += 10 * elapsed / 100
	}
	if(input.left === true) {
		player.x -= 10 * elapsed / 100
	}
	if(input.right === true) {
		player.x += 10 * elapsed / 100
	}

	// draw on cto
	cto.fillStyle = "darkblue";
	cto.fillRect(0, 0, cto.canvas.width, cto.canvas.height)
	drawPlayer()
	ctx.drawImage(cto.canvas, 0, 0, cto.canvas.width, cto.canvas.height, 0, 0, canvas.width, canvas.height)
}


function drawMap() {

	cto.fillStyle = "darkgrey"
	for(let y=0; y<mapy; y++) {
		for(let x=0; x<mapx; x++) {
			if(map[y * mapy + x] !== 0) {
				cto.fillRect(x * maps, y * maps, maps, maps)
			}
		}
	}
}

function drawPlayer() {
	cto.fillStyle = "yellow";
	cto.fillRect(Math.round(player.x/scale)-1, Math.round(player.y/scale)-1, 2, 2);
}


function window_onkeydown(evt) {
	if(evt.code === "ArrowUp") {
		input.up = true
	}
	else if(evt.code === "ArrowDown") {
		input.down = true
	}
	else if(evt.code === "ArrowLeft") {
		input.left = true
	}
	else if(evt.code === "ArrowRight") {
		input.right = true
	}
}


function window_onkeyup(evt) {
	if(evt.code === "ArrowUp") {
		input.up = false
	}
	else if(evt.code === "ArrowDown") {
		input.down = false
	}
	else if(evt.code === "ArrowLeft") {
		input.left = false
	}
	else if(evt.code === "ArrowRight") {
		input.right = false
	}
}


function canvas_on_mousemove(evt) {
	// let brect = canvas.getBoundingClientRect()
	// env.mouse.x = evt.clientX - brect.left
	// env.mouse.y = evt.clientY - brect.top
	// document.querySelector(".debug > .left").innerHTML = `x: ${env.mouse.x} y: ${env.mouse.y} b: ${env.mouse.button}`
}


function canvas_on_mousedown(evt) {
	// let brect = canvas.getBoundingClientRect()
	// env.mouse.x = evt.clientX - brect.left
	// env.mouse.y = evt.clientY - brect.top
	// env.mouse.button = true
	// document.querySelector(".debug > .left").innerHTML = `x: ${env.mouse.x} y: ${env.mouse.y} b: ${env.mouse.button}`
}


function canvas_on_mouseup(evt) {
	// let brect = canvas.getBoundingClientRect()
	// env.mouse.x = evt.clientX - brect.left
	// env.mouse.y = evt.clientY - brect.top
	// env.mouse.button = false
	// document.querySelector(".debug > .left").innerHTML = `x: ${env.mouse.x} y: ${env.mouse.y} b: ${env.mouse.button}`
}

