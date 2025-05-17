"use strict"

window.addEventListener("load", window_on_load)


let scale = 2
let canvas = null
let ctx = null
let cto = null
let player = { x: 300, y: 300, dir: -Math.PI/2 }
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

	process_input(elapsed)

	// draw on cto
	cto.fillStyle = "darkblue";
	cto.fillRect(0, 0, cto.canvas.width, cto.canvas.height)

	drawMap()
	drawPlayer()
	ctx.drawImage(cto.canvas, 0, 0, cto.canvas.width, cto.canvas.height, 0, 0, canvas.width, canvas.height)
}


function drawMap() {

	cto.fillStyle = "darkgrey"
	for(let y=0; y<mapy; y++) {
		for(let x=0; x<mapx; x++) {
			if(map[y * mapy + x] !== 0) {
				cto.fillRect(x * maps / scale + 1, y * maps / scale + 1, maps / scale - 1, maps / scale - 1)
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
	cto.lineTo(px - 0.5 + Math.cos(player.dir) * dir_length, py + Math.sin(player.dir) * dir_length)
	cto.stroke()

	cto.fillRect(px - 3, py - 3, 5, 5)
}


function castrays() {

	// Vertical
	dof=0; side=0; disV=100000;
	float Tan=tan(degToRad(ra));

	// looking left
	if(cos(degToRad(ra))> 0.001) { 
		rx=(((int)px>>6)<<6)+64;
		ry=(px-rx)*Tan+py;
		xo= 64; yo=-xo*Tan;
	}
	// looking right
	else if(cos(degToRad(ra))<-0.001) { 
		rx=(((int)px>>6)<<6) -0.0001; 
		ry=(px-rx)*Tan+py; 
		xo=-64; 
		yo=-xo*Tan;
	}
	//looking up or down. no hit
	else { 
		rx=px; 
		ry=py; 
		dof=8;
	}

	while(dof < 8) {
		mx = (int)(rx)>>6
		my = (int)(ry)>>6
		mp = my * mapX + mx
		// hit
		if(mp>0 && mp<mapX*mapY && map[mp]==1) { 
			dof = 8
			disV = cos(degToRad(ra))*(rx-px)-sin(degToRad(ra))*(ry-py)
		}
		// check next horizontal
		else { 
			rx += xo
			ry += yo
			dof += 1
		}
	} 
	vx = rx 
	vy = ry

	//---Horizontal---
	// dof=0; disH=100000;
	// Tan=1.0/Tan; 
	// if(sin(degToRad(ra))> 0.001){ ry=(((int)py>>6)<<6) -0.0001; rx=(py-ry)*Tan+px; yo=-64; xo=-yo*Tan;}//looking up 
	// else if(sin(degToRad(ra))<-0.001){ ry=(((int)py>>6)<<6)+64;      rx=(py-ry)*Tan+px; yo= 64; xo=-yo*Tan;}//looking down
	// else{ rx=px; ry=py; dof=8;}                                                   //looking straight left or right

	// while(dof<8) 
	// { 
	// mx=(int)(rx)>>6; my=(int)(ry)>>6; mp=my*mapX+mx;                          
	// if(mp>0 && mp<mapX*mapY && map[mp]==1){ dof=8; disH=cos(degToRad(ra))*(rx-px)-sin(degToRad(ra))*(ry-py);}//hit         
	// else{ rx+=xo; ry+=yo; dof+=1;}                                               //check next horizontal
	// } 

	// glColor3f(0,0.8,0);
	// if(disV<disH){ rx=vx; ry=vy; disH=disV; glColor3f(0,0.6,0);}                  //horizontal hit first
	// glLineWidth(2); glBegin(GL_LINES); glVertex2i(px,py); glVertex2i(rx,ry); glEnd();//draw 2D ray
    
}


function process_input(elapsed) {

	if(input.up === true) {
		player.y += 10 * Math.sin(player.dir) * elapsed / 100
		player.x += 10 * Math.cos(player.dir) * elapsed / 100
	}
	if(input.down === true) {
		player.y -= 10 * Math.sin(player.dir) * elapsed / 100
		player.x -= 10 * Math.cos(player.dir) * elapsed / 100
	}
	if(input.left === true) {
		player.dir -= 0.25 * elapsed / 100
	}
	if(input.right === true) {
		player.dir += 0.25 * elapsed / 100
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
	console.log(evt)
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

