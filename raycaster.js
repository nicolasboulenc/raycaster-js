
"use strict"

window.addEventListener("load", window_on_load)

let scale = 2
let canvas = null
let ctx = null
let cto = null
let player = { x: 300, y: 300, dir: Math.PI/2 }
let input = { up: false, down: false, left: false, right: false }
let timeprev = 0

let map_w = 8
let map_h = 8
let map_s = 64
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
	cto.imageSmoothingEnabled = false

	timeprev = Date.now()
	loop()
}


function loop(timestamp) {

	window.requestAnimationFrame(loop)
	let elapsed = timestamp - timeprev
	timeprev = timestamp

	process_input(elapsed)

	// draw on cto
	cto.fillStyle = "darkblue"
	cto.fillRect(0, 0, cto.canvas.width, cto.canvas.height)

	drawMap()
	drawPlayer()

	castrays()

	ctx.drawImage(cto.canvas, 0, 0, cto.canvas.width, cto.canvas.height, 0, 0, canvas.width, canvas.height)
}


function drawMap() {

	cto.fillStyle = "darkgrey"
	for(let y=0; y<map_h; y++) {
		for(let x=0; x<map_w; x++) {
			if(map[y * map_h + x] !== 0) {
				cto.fillRect(x * map_s / scale + 1, y * map_s / scale + 1, map_s / scale - 1, map_s / scale - 1)
			}
		}
	}
}


function drawPlayer() {

	cto.fillStyle = "yellow"
	cto.strokeStyle = "yellow"
	cto.lineWidth = 1

	let px = Math.round(player.x/scale)
	let py = Math.round(player.y/scale)
	const dir_length = 10

	cto.beginPath()
	cto.moveTo(px - 0.5, py)
	cto.lineTo(px - 0.5 + Math.cos(player.dir) * dir_length, py + Math.sin(player.dir) * dir_length * -1)
	cto.stroke()

	cto.fillRect(px - 3, py - 3, 5, 5)
}


function castrays() {

	const max_len = Math.max(map_w * map_s, map_h * map_s)
	const epsilon = 0.0001

	let ray_rad = player.dir
	let dir_tan = Math.tan(ray_rad)
	let dir_inv_tan = 1.0 / dir_tan
	let dir_cos = Math.cos(ray_rad)
	let dir_sin = Math.sin(ray_rad)


	// Ray that check vertical intersections
	let ray_ver = {	x: 0, y: 0, x_step: 0, y_step: 0, len: 0, has_hit: false }

	if(dir_cos > epsilon) {
		// looking left
		ray_ver.x = (Math.floor(player.x / map_s) * map_s) + map_s
		ray_ver.y = (player.x - ray_ver.x) * dir_tan + player.y
		ray_ver.x_step = map_s
		ray_ver.y_step = -ray_ver.x_step * dir_tan
		ray_ver.len = dir_cos * (ray_ver.x - player.x) - dir_sin * (ray_ver.y - player.y)
	}
	else if(dir_cos < -epsilon) {
		// looking right
		ray_ver.x = (Math.floor(player.x / map_s) * map_s) - epsilon
		ray_ver.y = (player.x - ray_ver.x) * dir_tan + player.y
		ray_ver.x_step = -map_s
		ray_ver.y_step = -ray_ver.x_step * dir_tan
		ray_ver.len = dir_cos * (ray_ver.x - player.x) - dir_sin * (ray_ver.y - player.y)
	}
	else {
		// looking up or down. no hit
		ray_ver.x = player.x
		ray_ver.y = player.y
		ray_ver.len = max_len
	}


	// Ray that check vertical intersections
	let ray_hor = {	x: 0, y: 0, x_step: 0, y_step: 0, len: 0, has_hit: false }

	if(dir_sin > epsilon) {
		// looking up
		ray_hor.y = Math.floor(player.y / map_s) * map_s - epsilon
		ray_hor.x = (player.y - ray_hor.y) * dir_inv_tan + player.x
		ray_hor.y_step = -map_s
		ray_hor.x_step = -ray_hor.y_step * dir_inv_tan
		ray_hor.len = dir_cos * (ray_hor.x - player.x) - dir_sin * (ray_hor.y - player.y)
	}
	else if(dir_sin < -epsilon) {
		//looking down
		ray_hor.y = Math.floor(player.y / map_s) * map_s + map_s
		ray_hor.x = (player.y - ray_hor.y) * dir_inv_tan + player.x
		ray_hor.y_step = map_s
		ray_hor.x_step = -ray_hor.y_step * dir_inv_tan
		ray_hor.len = dir_cos * (ray_hor.x - player.x) - dir_sin * (ray_hor.y - player.y)
	}
	else {
		ray_hor.x = player.x
		ray_hor.y = player.y
		ray_hor.len = max_len
	}


	let ray_cur = ray_ver
	while(true) {

		if(ray_ver.has_hit) {
			ray_cur = ray_hor
		}
		else if(ray_hor.has_hit) {
			ray_cur = ray_ver
		}
		else if(ray_hor.len < ray_ver.len) {
			ray_cur = ray_hor
		}
		else {
			ray_cur = ray_ver
		}

		let map_x = Math.floor(ray_cur.x / map_s)
		let map_y = Math.floor(ray_cur.y / map_s)
		let map_idx = map_y * map_w + map_x

		if(map_idx > 0 && map_idx < map_w * map_h && map[map_idx] !== 0) {
			// hit
			ray_cur.has_hit = true
			ray_cur.len = dir_cos * (ray_cur.x - player.x) - dir_sin * (ray_cur.y - player.y)
		}
		else if(map_x >= 0 && map_x < map_w && map_y >= 0 && map_y < map_h) {
			ray_cur.x += ray_cur.x_step
			ray_cur.y += ray_cur.y_step
			ray_cur.len = dir_cos * (ray_cur.x - player.x) - dir_sin * (ray_cur.y - player.y)
		}
		else {
			// outside level?
			ray_cur.len = max_len
		}

		if(ray_ver.has_hit && ray_ver.len < ray_hor.len) break;
		if(ray_hor.has_hit && ray_hor.len < ray_ver.len) break;
		if(ray_ver.has_hit && ray_hor.has_hit) break;
		if(ray_ver.len >= max_len && ray_hor.len >= max_len) break; // can this happen? if outside level?
	}

	cto.strokeStyle = "red"
	cto.lineWidth = 4
	cto.beginPath()
	cto.moveTo(Math.round(player.x / scale), 	Math.round(player.y / scale))
	cto.lineTo(Math.round(ray_ver.x / scale), 	Math.round(ray_ver.y / scale))
	cto.stroke()

	cto.strokeStyle = "green"
	cto.lineWidth = 2
	cto.beginPath()
	cto.moveTo(Math.round(player.x / scale), 	Math.round(player.y / scale))
	cto.lineTo(Math.round(ray_hor.x / scale),	Math.round(ray_hor.y / scale))
	cto.stroke()
}


function process_input(elapsed) {

	if(input.up === true) {
		player.x += 10 * Math.cos(player.dir) * elapsed / 100
		player.y += 10 * Math.sin(player.dir) * elapsed / 100 * -1
	}
	if(input.down === true) {
		player.x -= 10 * Math.cos(player.dir) * elapsed / 100
		player.y -= 10 * Math.sin(player.dir) * elapsed / 100 * -1
	}
	if(input.left === true) {
		player.dir += 0.25 * elapsed / 100
	}
	if(input.right === true) {
		player.dir -= 0.25 * elapsed / 100
	}
}


function window_onkeydown(evt) {
	if(evt.code === "ArrowUp" || evt.code === "KeyW") {
		input.up = true
	}
	else if(evt.code === "ArrowDown" || evt.code === "KeyS") {
		input.down = true
	}
	else if(evt.code === "ArrowLeft" || evt.code === "KeyA") {
		input.left = true
	}
	else if(evt.code === "ArrowRight" || evt.code === "KeyD") {
		input.right = true
	}
}


function window_onkeyup(evt) {
	if(evt.code === "ArrowUp" || evt.code === "KeyW") {
		input.up = false
	}
	else if(evt.code === "ArrowDown" || evt.code === "KeyS") {
		input.down = false
	}
	else if(evt.code === "ArrowLeft" || evt.code === "KeyA") {
		input.left = false
	}
	else if(evt.code === "ArrowRight" || evt.code === "KeyD") {
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

