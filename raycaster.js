
"use strict"

const PLAYER_SPEED 				= 128		// 2 tiles per seconds
const PLAYER_ROTATION 			= Math.PI


let res = { w: 320, h: 200 }
let fov = 1.58
let proj_dst = 0
let angles = []

let scale = 2
let canvas = null
let ctx = null
let cto_map = null		// buffer to draw map on
let cto_render = null	// buffer to render level on
let image_data_render = null

let player = { x: 2.5 * 64, y: 352, dir: Math.PI/4 }
let input = { up: false, down: false, left: false, right: false }
let timeprev = 0
let player_rotation_carry_over = 0


let image_data_texture = null

let draw_map = false

let map_w = 8
let map_h = 8
let map_s = 64
let map = [
	1, 1, 1, 1, 1, 1, 1, 1,
	1, 0, 1, 0, 0, 0, 0, 1,
	1, 0, 1, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 1, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 1,
	1, 1, 1, 1, 1, 1, 1, 1
]

window.addEventListener("load", window_on_load)
document.getElementById("fov").addEventListener("input", fov_onchange)

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

	cto_map = new OffscreenCanvas(res.w, res.h).getContext("2d")
	cto_map.imageSmoothingEnabled = false

	cto_render = new OffscreenCanvas(res.w, res.h).getContext("2d")
	cto_render.imageSmoothingEnabled = false
	image_data_render = new ImageData(res.w, res.h)

	let texture = document.querySelector("img")
	let cto_texture = new OffscreenCanvas(texture.width, texture.height).getContext("2d")
	cto_texture.drawImage(texture, 0, 0)
	image_data_texture = cto_texture.getImageData(0, 0, texture.width, texture.height)

	update_angles()

	timeprev = Date.now()
	loop()
	// angles = [0]
	// castrays()
	// castrays3()
}


function update_angles() {

	angles = []

	proj_dst = (res.w / 2) / Math.tan(fov / 2)
	// console.log(proj_dst)

	for(let i=-res.w/2; i<res.w/2; i++) {
		let angle = Math.atan2(i, proj_dst)
		angles.push(angle)
	}
}


function loop(timestamp) {

	window.requestAnimationFrame(loop)
	let elapsed = timestamp - timeprev
	timeprev = timestamp

	process_input(elapsed)

	// draw on cto

	const rays = castrays3()

	if(draw_map) {
		cto_map.fillStyle = "darkblue"
		cto_map.fillRect(0, 0, cto_map.canvas.width, cto_map.canvas.height)
		drawMap(rays)
		ctx.drawImage(cto_map.canvas, 0, 0, cto_map.canvas.width, cto_map.canvas.height, 0, 0, canvas.width, canvas.height)
	}
	else {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
		drawLevel(rays)
		ctx.drawImage(cto_render.canvas, 0, 0, cto_render.canvas.width, cto_render.canvas.height, 0, 0, canvas.width, canvas.height)
	}
}


function drawMap(rays) {
	// draw map
	cto_map.fillStyle = "darkgrey"
	for(let y=0; y<map_h; y++) {
		for(let x=0; x<map_w; x++) {
			if(map[y * map_h + x] !== 0) {
				cto_map.fillRect(x * map_s / scale, y * map_s / scale, map_s / scale, map_s / scale)
			}
		}
	}

	// draw rays
	let first_ray = 0
	cto_map.lineWidth = 2
	for(let ray of rays) {
		if(first_ray < 2) {
			cto_map.strokeStyle = "white"
			first_ray++
		}
		else if(ray.type === "h") {
			cto_map.strokeStyle = "red"
		}
		else {
			cto_map.strokeStyle = "green"
		}
		cto_map.beginPath()
		cto_map.moveTo(player.x / scale, 		player.y / scale)
		cto_map.lineTo(ray.x * map_s / scale, 	ray.y * map_s / scale)
		cto_map.stroke()
	}

	// draw player
	cto_map.fillStyle = "yellow"
	cto_map.strokeStyle = "yellow"
	cto_map.lineWidth = 1

	let px = Math.floor(player.x / scale)
	let py = Math.floor(player.y / scale)
	const dir_length = 16

	cto_map.beginPath()
	cto_map.moveTo(px - 0.5, py)
	cto_map.lineTo(px - 0.5 + Math.cos(player.dir) * dir_length, py + Math.sin(player.dir) * dir_length * -1)
	cto_map.stroke()

	cto_map.fillRect(px - 3, py - 3, 5, 5)
}

function drawLevel(rays) { 

	image_data_render.data.fill(0)

	// for pixel to distance calc
	const fov_tan = Math.tan(fov/2)

	document.getElementById("debug").innerHTML = `fov: ${fov} proj_dst: ${proj_dst}`

	let x = 0
	for(let ray of rays) {

		let dst = ray.dst * Math.cos(player.dir - ray.a) * map_s

		// calculate pixel-length
		const pixel_length = dst * fov_tan / (res.w/2)
		const h = Math.floor(map_s / pixel_length)

		let y0 = Math.floor((res.h - h) / 2)
		let y1 = y0 + h

		let u = 0
		if(ray.type === "v") {
			u = ray.y - Math.floor(ray.y)
			if(ray.a  > Math.PI/2 || ray.a  < -Math.PI/2) u = 1 - u
		}
		else {
			u = ray.x - Math.floor(ray.x)
			if(ray.a < 0) u = 1 - u
		}

		// if(ray.a < player.dir + 0.001 && ray.a > player.dir - 0.001) {
		// 	document.getElementById("debug").innerHTML = `player_dir: ${player.dir.toFixed(3)} text_u: ${u.toFixed(3)}`
		// }

		let texture_x = Math.floor(map_s * u)
		for(let y=y0; y<y1; y++) {

			let v = (y - y0) / h
			let texture_y = Math.floor(map_s * v)
			// let texture_i = texture_y * 384 + texture_x
			let texture_i = texture_y * 64 + texture_x
			let color = { 
				r: image_data_texture.data[texture_i * 4 + 0],
				g: image_data_texture.data[texture_i * 4 + 1],
				b: image_data_texture.data[texture_i * 4 + 2],
				a: image_data_texture.data[texture_i * 4 + 3]
			}

			image_data_render.data[ (y * res.w + x) * 4 + 0] = color.r
			image_data_render.data[ (y * res.w + x) * 4 + 1] = color.g
			image_data_render.data[ (y * res.w + x) * 4 + 2] = color.b
			image_data_render.data[ (y * res.w + x) * 4 + 3] = color.a
		}
		x++
	}

	cto_render.putImageData(image_data_render, 0, 0)	

	cto_render.strokeStyle = "yellow"
	cto_render.lineWidth = 1
	cto_render.beginPath()
	cto_render.moveTo(res.w / 2,	res.h / 2 - 1)
	cto_render.lineTo(res.w / 2, 	res.h / 2 + 1)
	cto_render.stroke()
}

function castrays3() {

	const max_dst = Math.max(map_w, map_h)
	const epsilon = 0.0001

	let rays = []
	let player_x = player.x / map_s
	let player_y = player.y / map_s

	for(let angle of angles) {

		let ray_rad = player.dir - angle
		let dir_tan = Math.tan(ray_rad)
		let dir_inv_tan = 1.0 / dir_tan
		let dir_cos = Math.cos(ray_rad)
		let dir_sin = Math.sin(ray_rad)


		// Ray that check vertical intersections
		let ray_ver = {	a: ray_rad, x: 0, y: 0, x_step: 0, y_step: 0, dst: 0, has_hit: false, type: "v" }

		if(dir_cos > epsilon) {
			// looking right
			ray_ver.x = Math.floor(player_x) + 1
			ray_ver.y = (player_x - ray_ver.x) * dir_tan + player_y
			ray_ver.x_step = 1
			ray_ver.y_step = -ray_ver.x_step * dir_tan
			ray_ver.dst = dir_cos * (ray_ver.x - player_x) - dir_sin * (ray_ver.y - player_y)
		}
		else if(dir_cos < -epsilon) {
			// looking left
			ray_ver.x = Math.floor(player_x) - epsilon
			ray_ver.y = (player_x - ray_ver.x) * dir_tan + player_y
			ray_ver.x_step = -1
			ray_ver.y_step = -ray_ver.x_step * dir_tan
			ray_ver.dst = dir_cos * (ray_ver.x - player_x) - dir_sin * (ray_ver.y - player_y)
		}
		else {
			// looking up or down. no hit
			ray_ver.x = player_x
			ray_ver.y = player_y
			ray_ver.dst = Infinity
		}


		// Ray that check vertical intersections
		let ray_hor = {	a: ray_rad, x: 0, y: 0, x_step: 0, y_step: 0, dst: 0, has_hit: false, type: "h" }

		if(dir_sin > epsilon) {
			// looking up
			ray_hor.y = Math.floor(player_y) - epsilon
			ray_hor.x = (player_y - ray_hor.y) * dir_inv_tan + player_x
			ray_hor.y_step = -1
			ray_hor.x_step = -ray_hor.y_step * dir_inv_tan
			ray_hor.dst = dir_cos * (ray_hor.x - player_x) - dir_sin * (ray_hor.y - player_y)
		}
		else if(dir_sin < -epsilon) {
			//looking down
			ray_hor.y = Math.floor(player_y) + 1
			ray_hor.x = (player_y - ray_hor.y) * dir_inv_tan + player_x
			ray_hor.y_step = 1
			ray_hor.x_step = -ray_hor.y_step * dir_inv_tan
			ray_hor.dst = dir_cos * (ray_hor.x - player_x) - dir_sin * (ray_hor.y - player_y)
		}
		else {
			ray_hor.x = player_x
			ray_hor.y = player_y
			ray_hor.dst = Infinity
		}

		let map_x = Math.floor(player_x)
		let map_y = Math.floor(player_y)
		let ray_cur = ray_ver
		while(true) {

			if(ray_hor.dst < ray_ver.dst) {
				ray_cur = ray_hor
			}
			else {
				ray_cur = ray_ver
			}

			let map_idx = map_y * map_w + map_x

			if(map_x >= 0 && map_x < map_w && map_y >= 0 && map_y < map_h && map[map_idx] !== 0) {
				// hit
				ray_cur.has_hit = true
				ray_cur.dst = dir_cos * (ray_cur.x - player_x) - dir_sin * (ray_cur.y - player_y)
				// ray_cur.c = (map_x + map_y) % 2
			}
			else if(map_x >= 0 && map_x < map_w && map_y >= 0 && map_y < map_h) {
				ray_cur.x += ray_cur.x_step
				ray_cur.y += ray_cur.y_step
				ray_cur.dst = dir_cos * (ray_cur.x - player_x) - dir_sin * (ray_cur.y - player_y)
			}
			else {
				// outside level?
				ray_cur.dst = Infinity
			}

			if(ray_ver.has_hit && ray_ver.dst < ray_hor.dst) {
				rays.push(ray_ver)
				break
			}
			if(ray_hor.has_hit && ray_hor.dst < ray_ver.dst) {
				rays.push(ray_hor)
				break
			}
			if(ray_ver.dst >= max_dst && ray_hor.dst >= max_dst) {
				// can this happen? if outside level?
				rays.push(ray_ver)
				break
			}
			// if(ray_ver.has_hit && ray_hor.has_hit) break;
		}
	}

	return rays

}


function castrays() {

	const max_dst = Math.max(map_w, map_h)
	const epsilon = 0.0001

	let rays = []
	let player_x = player.x / map_s
	let player_y = player.y / map_s

	for(let angle of angles) {

		let ray_rad = player.dir - angle
		let dir_tan = Math.tan(ray_rad)
		let dir_inv_tan = 1.0 / dir_tan
		let dir_cos = Math.cos(ray_rad)
		let dir_sin = Math.sin(ray_rad)


		// Ray that check vertical intersections
		let ray_ver = {	a: ray_rad, x: 0, y: 0, x_step: 0, y_step: 0, dst: 0, has_hit: false, type: "v" }

		if(dir_cos > epsilon) {
			// looking right
			ray_ver.x = Math.floor(player_x) + 1
			ray_ver.y = (player_x - ray_ver.x) * dir_tan + player_y
			ray_ver.x_step = 1
			ray_ver.y_step = -ray_ver.x_step * dir_tan
			ray_ver.dst = dir_cos * (ray_ver.x - player_x) - dir_sin * (ray_ver.y - player_y)
		}
		else if(dir_cos < -epsilon) {
			// looking left
			ray_ver.x = Math.floor(player_x) - epsilon
			ray_ver.y = (player_x - ray_ver.x) * dir_tan + player_y
			ray_ver.x_step = -1
			ray_ver.y_step = -ray_ver.x_step * dir_tan
			ray_ver.dst = dir_cos * (ray_ver.x - player_x) - dir_sin * (ray_ver.y - player_y)
		}
		else {
			// looking up or down. no hit
			ray_ver.x = player_x
			ray_ver.y = player_y
			ray_ver.dst = Infinity
		}


		// Ray that check vertical intersections
		let ray_hor = {	a: ray_rad, x: 0, y: 0, x_step: 0, y_step: 0, dst: 0, has_hit: false, type: "h" }

		if(dir_sin > epsilon) {
			// looking up
			ray_hor.y = Math.floor(player_y) - epsilon
			ray_hor.x = (player_y - ray_hor.y) * dir_inv_tan + player_x
			ray_hor.y_step = -1
			ray_hor.x_step = -ray_hor.y_step * dir_inv_tan
			ray_hor.dst = dir_cos * (ray_hor.x - player_x) - dir_sin * (ray_hor.y - player_y)
		}
		else if(dir_sin < -epsilon) {
			//looking down
			ray_hor.y = Math.floor(player_y) + 1
			ray_hor.x = (player_y - ray_hor.y) * dir_inv_tan + player_x
			ray_hor.y_step = 1
			ray_hor.x_step = -ray_hor.y_step * dir_inv_tan
			ray_hor.dst = dir_cos * (ray_hor.x - player_x) - dir_sin * (ray_hor.y - player_y)
		}
		else {
			ray_hor.x = player_x
			ray_hor.y = player_y
			ray_hor.dst = Infinity
		}


		let ray_cur = ray_ver
		while(true) {

			if(ray_ver.has_hit) {
				ray_cur = ray_hor
			}
			else if(ray_hor.has_hit) {
				ray_cur = ray_ver
			}
			else if(ray_hor.dst < ray_ver.dst) {
				ray_cur = ray_hor
			}
			else {
				ray_cur = ray_ver
			}

			let map_x = Math.floor(ray_cur.x)
			let map_y = Math.floor(ray_cur.y)
			let map_idx = map_y * map_w + map_x

			if(map_x >= 0 && map_x < map_w && map_y >= 0 && map_y < map_h && map[map_idx] !== 0) {
				// hit
				ray_cur.has_hit = true
				ray_cur.dst = dir_cos * (ray_cur.x - player_x) - dir_sin * (ray_cur.y - player_y)
				// ray_cur.c = (map_x + map_y) % 2
			}
			else if(map_x >= 0 && map_x < map_w && map_y >= 0 && map_y < map_h) {
				ray_cur.x += ray_cur.x_step
				ray_cur.y += ray_cur.y_step
				ray_cur.dst = dir_cos * (ray_cur.x - player_x) - dir_sin * (ray_cur.y - player_y)
			}
			else {
				// outside level?
				ray_cur.dst = Infinity
			}

			if(ray_ver.has_hit && ray_ver.dst < ray_hor.dst) {
				rays.push(ray_ver)
				break
			}
			if(ray_hor.has_hit && ray_hor.dst < ray_ver.dst) {
				rays.push(ray_hor)
				break
			}
			if(ray_ver.dst >= max_dst && ray_hor.dst >= max_dst) {
				// can this happen? if outside level?
				rays.push(ray_ver)
				break
			}
			// if(ray_ver.has_hit && ray_hor.has_hit) break;
		}
	}

	return rays
}

function castrays2() {

	let rays = []
	let vRayStart = { x: player.x / map_s, y: player.y / map_s }
	let vMapSize = { x: map_w, y: map_w }
	let vecMap = map

	for (let angle of angles) {

		let ray_rad = player.dir + angle
		let vRayDir = { x: Math.cos(ray_rad), y: Math.sin(ray_rad) }
		let vRayUnitStepSize = { x: Math.sqrt(1 + (vRayDir.y / vRayDir.x) * (vRayDir.y / vRayDir.x)), y: Math.sqrt(1 + (vRayDir.x / vRayDir.y) * (vRayDir.x / vRayDir.y)) }
		let vMapCheck = { x: Math.floor(vRayStart.x), y: Math.floor(vRayStart.y) }
		let vRayLength1D = { x: 0, y: 0 }
		let vStep = { x: 0, y: 0 }

		// Establish Starting Conditions
		if (vRayDir.x < 0) {
			vStep.x = -1
			vRayLength1D.x = (vRayStart.x - vMapCheck.x) * vRayUnitStepSize.x
		}
		else {
			vStep.x = 1
			vRayLength1D.x = (vMapCheck.x + 1 - vRayStart.x) * vRayUnitStepSize.x
		}

		if (vRayDir.y < 0) {
			vStep.y = -1
			vRayLength1D.y = (vRayStart.y - vMapCheck.y) * vRayUnitStepSize.y
		}
		else {
			vStep.y = 1
			vRayLength1D.y = (vMapCheck.y + 1 - vRayStart.y) * vRayUnitStepSize.y
		}

		// Perform "Walk" until collision or range check
		let bTileFound = false
		let fMaxDistance = 100.0
		let fDistance = 0.0
		while (!bTileFound && fDistance < fMaxDistance)	{
			// Walk along shortest path
			if (vRayLength1D.x < vRayLength1D.y) {
				vMapCheck.x += vStep.x
				fDistance = vRayLength1D.x
				vRayLength1D.x += vRayUnitStepSize.x
			}
			else {
				vMapCheck.y += vStep.y
				fDistance = vRayLength1D.y
				vRayLength1D.y += vRayUnitStepSize.y
			}

			// Test tile at new test point
			if (vMapCheck.x >= 0 && vMapCheck.x < vMapSize.x && vMapCheck.y >= 0 && vMapCheck.y < vMapSize.y) {
				if (vecMap[vMapCheck.y * vMapSize.x + vMapCheck.x] == 1) {
					bTileFound = true
				}
			}
		}

		// Calculate intersection location
		let vIntersection
		if (bTileFound) {
			vIntersection = vRayStart + vRayDir * fDistance
		}

		let ray = {	a: ray_rad, x: (vRayStart.x + vRayDir.x * fDistance), y: (vRayStart.y + vRayDir.y * fDistance), x_step: 0, y_step: 0, dst: fDistance, has_hit: bTileFound }
		rays.push(ray)
	}

	return rays
}


function process_input(elapsed) {

	if(input.up === true) {
		player.x += PLAYER_SPEED * Math.cos(player.dir) * elapsed / 1000
		player.y -= PLAYER_SPEED * Math.sin(player.dir) * elapsed / 1000
	}
	if(input.down === true) {
		player.x -= PLAYER_SPEED * Math.cos(player.dir) * elapsed / 1000
		player.y += PLAYER_SPEED * Math.sin(player.dir) * elapsed / 1000
	}
	if(input.left === true) {
		let rotation = PLAYER_ROTATION * elapsed / 1000
		player.dir += rotation
		if(player.dir > Math.PI) player.dir -= Math.PI*2
	}
	if(input.right === true) {
		let rotation = PLAYER_ROTATION * elapsed / 1000
		player.dir -= rotation
		if(player.dir < -Math.PI) player.dir += Math.PI*2
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
	else if(evt.code === "KeyM") {
		draw_map = !draw_map
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


function fov_onchange(evt) {
	fov = parseFloat(document.getElementById("fov").value)
	update_angles()
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

