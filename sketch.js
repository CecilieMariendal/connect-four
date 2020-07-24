console.log(`
 ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗    ██╗  ██╗
██╔════╝██╔═══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝    ██║  ██║
██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║       ███████║
██║     ██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║       ╚════██║
╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║            ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝            ╚═╝
`);

const canvas = document.getElementById("myCanvas");
const context = canvas.getContext('2d');


/**
 * @var Array.<string|boolean[]>
 */
const grid = [
	[false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false],
];

/** @var Array.<{x: number, y: number}> */
const previousIndex = [];

/** @var {x: number, y: number} */
let lastIndex;

/** @var 'red'|'blue' */
let currentPlayer;
let winner;


/**
 * Initiates game
 *
 * return void
 */
function initGame() {
	currentPlayer = 'red';
	
	document.addEventListener('mousemove', drawMarker);
	canvas.addEventListener('click', takeTurn);
	
	drawBoard();
}


/**
 * Erases current board and draws new board based on grid
 * 
 * return void
 */
function drawBoard() {
	context.clearRect(0, 100, canvas.width, canvas.height - 100);
	
	// Draw circles
	grid.forEach((row, rowIndex) => {
		row.forEach((value, columnIndex) => {
			const x = 100 / 2 + 100 * columnIndex;
			const y = 100 + 100 / 2 + 100 * rowIndex;
			
			context.beginPath();
			context.arc(x, y, 100 / 2 - 5, 0, 2 * Math.PI)
			
			context.fillStyle = (typeof value === 'string') ? getPlayerGradient(x, y, value) : 'white';
			context.fill()
		});
	})
	
	
	if (winner) {
		const text = winner.charAt(0).toUpperCase() + winner.slice(1) + ' wins!!';
		context.font = '60px sans-serif';
		context.textAlign = 'center';
		
		context.strokeStyle = 'white';
		context.lineWidth = 8;
		context.strokeText(text, 350, 400);
		
		context.fillStyle = winner;
		context.fillText(text, 350, 400);
	}
}


/**
 * Draws marker based on mouse position
 * 
 * @param {MouseEvent} event
 *
 * return void
 */
function drawMarker(event) {
	const indexX = Math.floor((event.clientX - canvas.offsetLeft) / 100)
	let positionX = (indexX * 100) + 50;
	
	if (event.clientX < canvas.offsetLeft + 50) {
		positionX = 50;
	} else if (event.clientX > canvas.offsetLeft + canvas.width - 50) {
		positionX = canvas.width - 50;
	}
	
	context.beginPath();
	context.clearRect(0, 0, canvas.width, 100);
	context.arc(positionX, 50, 100 / 2 - 5, 0, 2 * Math.PI);
	
	context.fillStyle = getPlayerGradient(positionX, 50, (getAvailableCell(indexX) !== null) ? currentPlayer : 'invalid');
	context.fill();
}


/**
 * Draws marker based on mouse position
 *
 * @param {MouseEvent} event
 *
 * return void
 */
function takeTurn(event) {
	const position = {x: Math.floor((event.clientX - canvas.offsetLeft) / 100)};
	position.y = getAvailableCell(position.x);
	
	if (position.y !== null) {
		grid[position.y][position.x] = currentPlayer;
		previousIndex.push(position);
		lastIndex = position;
		
		if (checkWinner()) {
			winner = currentPlayer;
			
			document.removeEventListener('mousemove', drawMarker);
			canvas.removeEventListener('click', takeTurn);
		}
		
		switchCurrentPlayer();
		
		drawMarker(event);
		drawBoard();
	}
}


/**
 * Check four in a row from last position
 *
 * return void
 */
function checkWinner() {
	let horizontal = 0;
	let vertical = 0;
	let diagonal1 = 0;
	let diagonal2 = 0;
	for (let i = 1; i <= 3; i++) {
		if (lastIndex.x - i > 0 && grid[lastIndex.y][lastIndex.x - i] === currentPlayer
		|| lastIndex.x + i < 7 && grid[lastIndex.y][lastIndex.x + i] === currentPlayer) {
			horizontal++;
		}
		
		if (lastIndex.y - i > 0 && grid[lastIndex.y - i][lastIndex.x] === currentPlayer
		|| lastIndex.y + i < 6 && grid[lastIndex.y + i][lastIndex.x] === currentPlayer) {
			vertical++;
		}
		
		if (lastIndex.y - i > 0 && grid[lastIndex.y - i][lastIndex.x - i] === currentPlayer
		|| lastIndex.y + i < 6 && grid[lastIndex.y + i][lastIndex.x + i] === currentPlayer) {
			diagonal1++;
		}
		
		if (lastIndex.y + i < 6 && grid[lastIndex.y + i][lastIndex.x - i] === currentPlayer
		|| lastIndex.y - i > 0 && grid[lastIndex.y - i][lastIndex.x + i] === currentPlayer) {
			diagonal2++;
		}
	}
	
	return horizontal >= 3 || vertical >= 3 || diagonal1 >= 3 || diagonal2 >= 3;
}


/**
 * switches current player
 *
 * return void
 */
function switchCurrentPlayer() {
	currentPlayer = (currentPlayer === 'red') ? 'blue' : 'red';
}


/**
 * Get first available cell based on x position
 *
 * @param {number} xIndex
 *
 * return null|number
 */
function getAvailableCell(xIndex) {
	for (let i = 6 - 1; i >= 0; i--) {
		if (! grid[i][xIndex]) {
			return i;
		}
	}
	
	return null;
}


/**
 * Creates a gradient based on player
 * 
 * @param {number} x
 * @param {number} y
 * @param {string} player
 *
 * return CanvasGradient
 */
function getPlayerGradient(x, y, player = currentPlayer) {
	const gradient = context.createRadialGradient(x, y - 25,10, x,y - 25,70);
	
	if (player === 'red') {
		gradient.addColorStop(0, '#ff0000');
		gradient.addColorStop(1, '#aa0202');
	} else if (player === 'blue') {
		gradient.addColorStop(0, '#0073ff');
		gradient.addColorStop(1, '#02539a');
	} else {
		gradient.addColorStop(0, '#8b8b8b');
		gradient.addColorStop(1, '#5a5a5a');
	}
	
	return gradient;
}


window.onload = initGame;
