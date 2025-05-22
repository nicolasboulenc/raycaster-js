
"use strict"

window.addEventListener("load", window_on_load)

let scale = 2
let canvas = null
let ctx = null
let cto = null
let player = { x: 300, y: 300, dir: Math.PI/2 }
let input = { up: false, down: false, left: false, right: false }
let timeprev = 0

let map_x = 8
let map_y = 8
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
	for(let y=0; y<map_y; y++) {
		for(let x=0; x<map_x; x++) {
			if(map[y * map_y + x] !== 0) {
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

	// Vertical
	let steps = 0
	let v_dist = 100000
	let ra = player.dir
	let dir_tan = Math.tan(ra);
	let rx, ry
	let xo, yo

	// looking left
	let dir_cos = Math.cos(ra)
	if(dir_cos > 0.001) {
		rx = (Math.floor(player.x / map_s) * map_s) + map_s
		ry = (player.x - rx) * dir_tan + player.y
		xo = map_s
		yo = -xo * dir_tan
	}
	// looking right
	else if(dir_cos < -0.001) { 
		rx = (Math.floor(player.x / map_s) * map_s) - 0.0001
		ry = (player.x - rx) * dir_tan + player.y
		xo = -map_s
		yo = -xo * dir_tan
	}
	//looking up or down. no hit
	else { 
		rx = player.x
		ry = player.y
		steps = 8
	}

	while(steps < 8) {
		let mx = Math.floor(rx / map_s)
		let my = Math.floor(ry / map_s)
		let mi = my * map_x + mx
		// hit
		if(mi > 0 && mi < map_x * map_y && map[mi] !== 0) {
			steps = 8
			v_dist = Math.cos(ra) * (rx - player.x) - Math.sin(ra) * (ry - player.y)
		}
		// check next horizontal
		else { 
			rx += xo
			ry += yo
			steps += 1
		}
	}

	cto.beginPath()
	cto.moveTo(Math.round(player.x / scale), 	Math.round(player.y / scale))
	cto.lineTo(Math.round(rx / scale), 		Math.round(ry / scale))
	cto.stroke()


	// vx = rx 
	// vy = ry

	// Horizontal
	dof = 0
	let h_dist = 100000
	let dir_inv_tan = 1.0 / dir_tan
	if(Math.sin(ra) > 0.001) {
		ry = Math.floor(player.y / map_s) * map_s - 0.0001
		rx = (player.y - ry) * dir_inv_tan + player.x
		yo = -map_s
		xo = -yo * dir_inv_tan
	}
	//looking up 
	else if(Math.sin(ra) < -0.001) { 
		ry = Math.floor(player.y / map_s) * map_s + map_s
		rx = (player.y - ry) * dir_inv_tan + player.x
		yo = map_s 
		xo = -yo * dir_inv_tan
	}
	//looking down
	else {
		rx = player.x
		ry = player.y
		dof = 8
	}                                                   //looking straight left or right

	while(dof<8) {
		mx = Math.floor(rx / 64) 
		my=(ry)>>6; 
		mp=my*map_x+mx;                          
		if(mp>0 && mp<map_x*map_y && map[mp]==1){ dof=8; h_dist=cos(degToRad(ra))*(rx-player.x)-sin(degToRad(ra))*(ry-player.y);}//hit         
		else{ rx+=xo; ry+=yo; dof+=1;}                                               //check next horizontal
	} 


	glColor3f(0,0.8,0);
	if(disV<h_dist){ rx=vx; ry=vy; h_dist=disV; glColor3f(0,0.6,0);}                  //horizontal hit first
	glLineWidth(2); glBegin(GL_LINES); glVertex2i(player.x,player.y); glVertex2i(rx,ry); glEnd();//draw 2D ray
    
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

