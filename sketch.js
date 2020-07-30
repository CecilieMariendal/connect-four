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

/** @var 'singlePlayer'|'multiplayer' */
let gameMode = 'singlePlayer';


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
		
		if (checkIfStreak(currentPlayer)) {
			winner = currentPlayer;
			
			document.removeEventListener('mousemove', drawMarker);
			canvas.removeEventListener('click', takeTurn);
		} else {
			if (gameMode === 'singlePlayer') {
				computerTurn();
			} else {
				switchCurrentPlayer();
			}
		}
		
		drawMarker(event);
		drawBoard();
	}
}


/**
 * Calculates best turn for computer an makes the move
 *
 * return void
 */
function computerTurn() {
	for (let i = 0; i < 7; i++) {
		const y = getAvailableCell(i);
		
		if (y === null) {
			continue;
		}
		
		const blueWouldWin = checkIfStreak('blue', 4, {y, x: i});
		if (blueWouldWin) {
			grid[y][i] = 'blue';
			previousIndex.push({y, i});
			lastIndex = {y, i};

			if (blueWouldWin) {
				winner = 'blue';

				document.removeEventListener('mousemove', drawMarker);
				canvas.removeEventListener('click', takeTurn);
			}

			return;
		}
		
		const redWouldWin = checkIfStreak('red', 3, {y, x: i});
		if (redWouldWin) {
			grid[y][i] = 'blue';
			previousIndex.push({y, i});
			lastIndex = {y, i};
			
			return;
		}
	}
	
	const possibleMoves = [];
	for (let x = 0; x < 7; x++) {
		const y = getAvailableCell(x);
		
		if (y === null) {
			continue;
		}
		
		let value = 0;
		// best first move
		if (y === 5 && x === 3) {
			value += 2;
		} else if (y === 5 && x === 2 || y === 5 && x === 4) {
			value += 1
		}
		
		// Can i get 3 in a row
		if (checkIfStreak('blue', 3, {y, x})) {
			value += 2;
		}
		
		// Can i get 2 in a row
		if (checkIfStreak('blue', 2, {y, x})) {
			value += 1;
		}
		
		possibleMoves.push({y, x, value});
	}
	
	const move = possibleMoves.reduce((prevMove, currMove) => {
		return (prevMove.value > currMove.value) ? prevMove : currMove;
	})
	
	grid[move.y][move.x] = 'blue';
	previousIndex.push(move);
	lastIndex = move;
}


/**
 * Check four in a row from last position
 *
 * return void
 */
function checkIfStreak(player, limit = 4, index = lastIndex) {
	let horizontalCount = 0;
	let horizontalPrevValue;
	for (let i = 0; i < 7; i++) {
		
		if (grid[index.y][i] === player) {
			horizontalCount++;
			
			if (horizontalCount >= limit) {
				return true;
			}
		} else if (horizontalPrevValue && horizontalPrevValue === player) {
			break;
		}
		
		horizontalPrevValue = grid[index.y][i];
	}
	
	let verticalCount = 0;
	let verticalPrevValue;
	for (let i = 0; i < 6; i++) {
		if (grid[i][index.x] === player) {
			verticalCount++;
			
			if (verticalCount >= limit) {
				return true;
			}
		} else if (verticalPrevValue && verticalPrevValue === player) {
			break;
		}
		
		verticalPrevValue = grid[i][index.x];
	}
	
	
	const diagonalCount = {
		forwardUp: 0,
		forwardDown: 0,
		backUp: 0,
		backDown: 0,
	};
	
	const diagonalPrevValue = {
		forwardUp: null,
		forwardDown: null,
		backUp: null,
		backDown: null,
	};
	
	for (let i = 1; i <= limit - 1; i++) {
		if (index.y - i > 0 && index.x + i < 7 && grid[index.y - i][index.x + i] === player) {
			diagonalCount.forwardUp++;
		} else if (diagonalPrevValue.forwardUp && diagonalPrevValue.forwardUp === player) {
			break;
		}
	}
	
	for (let i = 1; i <= limit - 1; i++) {
		if (index.y - i > 0 && index.x - i > 0 && grid[index.y - i][index.x - i] === player) {
			diagonalCount.forwardDown++;
		} else if (diagonalPrevValue.forwardDown && diagonalPrevValue.forwardDown === player) {
			break;
		}
	}
	for (let i = 1; i <= limit - 1; i++) {
		if (index.y + i < 6 && index.x + i < 7 && grid[index.y + i][index.x + i] === player) {
			diagonalCount.backUp++;
		} else if (diagonalPrevValue.backUp && diagonalPrevValue.backUp === player) {
			break;
		}
	}
	for (let i = 1; i <= limit - 1; i++) {
		if (index.y + i < 6 && index.x - i > 0 && grid[index.y + i][index.x - i] === player) {
			diagonalCount.backDown++;
		} else if (diagonalPrevValue.backDown && diagonalPrevValue.backDown === player) {
			break;
		}
	}
	
	return 1 + diagonalCount.backUp + diagonalCount.forwardDown >= limit
		|| 1 + diagonalCount.backDown + diagonalCount.forwardUp >= limit;
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
