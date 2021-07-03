import { Grid, Index, Players } from './_@types';



export default class Game {
  private readonly canvas = document.querySelector<HTMLCanvasElement>('#myCanvas')!;
  private readonly context = this.canvas.getContext('2d')!;

  private readonly grid: Grid = [
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ];

  private readonly previousIndex: Array<Index> = [];

  private lastIndex?: Index;

  private currentPlayer = Players.ONE
  private winner?: Players;

  private gameMode: 'singlePlayer' | 'multiplayer' = 'singlePlayer';

  
  constructor() {
    document.addEventListener('mousemove', this.drawMarker.bind(this));
    this.canvas.addEventListener('click', this.takeTurn.bind(this));

    this.drawBoard();
  }

  /**
   * Erases current board and draws new board based on grid
   */
  private drawBoard(): void {
    this.context.clearRect(0, 100, this.canvas.width, this.canvas.height - 100);

    // Draw circles
    this.grid.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        const x = 100 / 2 + 100 * columnIndex;
        const y = 100 + 100 / 2 + 100 * rowIndex;

        this.context.beginPath();
        this.context.arc(x, y, 100 / 2 - 5, 0, 2 * Math.PI);

        this.context.fillStyle = typeof value === 'string' ? this.getPlayerGradient(x, y, value) : 'white';
        this.context.fill();
      });
    });

    if (this.winner) {
      const text =this.winner.charAt(0).toUpperCase() + this.winner.slice(1) + ' wins!!';
      this.context.font = '60px sans-serif';
      this.context.textAlign = 'center';

      this.context.strokeStyle = 'white';
      this.context.lineWidth = 8;
      this.context.strokeText(text, 350, 400);

      this.context.fillStyle = this.winner;
      this.context.fillText(text, 350, 400);
    }
  }

  /**
   * Draws marker based on mouse position
   */
  private drawMarker(event: MouseEvent): void {
    const indexX = Math.floor((event.clientX - this.canvas.offsetLeft) / 100);
    let positionX = indexX * 100 + 50;

    if (event.clientX < this.canvas.offsetLeft + 50) {
      positionX = 50;
    } else if ( event.clientX >
      this.canvas.offsetLeft + this.canvas.width - 50
    ) {
      positionX = this.canvas.width - 50;
    }

    this.context.beginPath();
    this.context.clearRect(0, 0, this.canvas.width, 100);
    this.context.arc(positionX, 50, 100 / 2 - 5, 0, 2 * Math.PI);

    if (this.getAvailableCell(indexX) !== null) {
      this.context.fillStyle = this.getPlayerGradient(positionX, 50, this.currentPlayer);
    } else {
      this.context.fillStyle = this.getPlayerGradient(positionX, 50);
    }
    
    this.context.fill();
  }

  /**
   *
   */
  private takeTurn(event: MouseEvent): void {
    const x = Math.floor((event.clientX - this.canvas.offsetLeft) / 100);
    const y = this.getAvailableCell(x);

    if (y !== null) {
      const position = {y, x};
      this.grid[position.y][position.x] = this.currentPlayer;
      this.previousIndex.push(position);
      this.lastIndex = position;
      

      if (this.checkIfStreak(this.currentPlayer)) {
        this.winner = this.currentPlayer;

        document.removeEventListener('mousemove', this.drawMarker);
        this.canvas.removeEventListener('click', this.takeTurn);
      } else {
        if (this.gameMode === 'singlePlayer') {
          this.computerTurn();
        } else {
          this.switchCurrentPlayer();
        }
      }

      this.drawMarker(event);
      this.drawBoard();
    }
  }

  /**
   * switches current player
   */
  private switchCurrentPlayer(): void {
    this.currentPlayer = this.currentPlayer === Players.ONE ? Players.TWO : Players.ONE;
  }

  /**
   * Calculates best turn for computer an makes the move
   */
  private computerTurn(): void {
    for (let x = 0; x < 7; x++) {
      const y = this.getAvailableCell(x);

      if (y === null) {
        continue;
      }

      const blueWouldWin = this.checkIfStreak(Players.TWO, 4, { y,x });
      if (blueWouldWin) {
        this.grid[y][x] = Players.TWO;
        this.previousIndex.push({y,x});
        this.lastIndex = {y,x};

        if (blueWouldWin) {
          this.winner = Players.TWO;

          document.removeEventListener('mousemove', this.drawMarker);
          this.canvas.removeEventListener('click', this.takeTurn);
        }

        return;
      }

      const redWouldWin = this.checkIfStreak(Players.ONE, 3, {y,x});
      if (redWouldWin) {
        this.grid[y][x] = Players.TWO;
        this.previousIndex.push({y,x});
        this.lastIndex = {y,x};

        return;
      }
    }

    const possibleMoves = [];
    for (let x = 0; x < 7; x++) {
      const y = this.getAvailableCell(x);

      if (y === null) {
        continue;
      }

      let value = 0;
      // best first move
      if (y === 5 && x === 3) {
        value += 2;
      } else if ((y === 5 && x === 2) || (y === 5 && x === 4)) {
        value += 1;
      }

      // Can i get 3 in a row
      if (this.checkIfStreak(Players.TWO, 3, { y, x })) {
        value += 2;
      }

      // Can i get 2 in a row
      if (this.checkIfStreak(Players.TWO, 2, { y, x })) {
        value += 1;
      }

      possibleMoves.push({y,x,value});
    }

    const move = possibleMoves.reduce((prevMove, currMove) => {
      return prevMove.value > currMove.value ? prevMove : currMove;
    });

    this.grid[move.y][move.x] = Players.TWO;
    this.previousIndex.push(move);
    this.lastIndex = move;
  }

  /**
   * Check four in a row from last position
   */
  private checkIfStreak(player: Players, limit = 4, index = this.lastIndex): boolean {
    if (! index) {
      return false;
    }

    let horizontalCount = 0;
    let horizontalPrevValue;

    for (let i = 0; i < 7; i++) {
      if (this.grid[index.y][i] === player) {
        horizontalCount++;

        if (horizontalCount >= limit) {
          return true;
        }
      } else if (horizontalPrevValue && horizontalPrevValue === player) {
        break;
      }

      horizontalPrevValue = this.grid[index.y][i];
    }

    let verticalCount = 0;
    let verticalPrevValue;
    for (let i = 0; i < 6; i++) {
      if (this.grid[i][index.x] === player) {
        verticalCount++;

        if (verticalCount >= limit) {
          return true;
        }
      } else if (verticalPrevValue && verticalPrevValue === player) {
        break;
      }

      verticalPrevValue = this.grid[i][index.x];
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
      if (index.y - i > 0 && index.x + i < 7 && this.grid[index.y - i][index.x + i] === player) {
        diagonalCount.forwardUp++;
      } else if (diagonalPrevValue.forwardUp && diagonalPrevValue.forwardUp === player) {
        break;
      }
    }

    for (let i = 1; i <= limit - 1; i++) {
      if (index.y - i > 0 && index.x - i > 0 && this.grid[index.y - i][index.x - i] === player) {
        diagonalCount.forwardDown++;
      } else if (diagonalPrevValue.forwardDown && diagonalPrevValue.forwardDown === player) {
        break;
      }
    }
    for (let i = 1; i <= limit - 1; i++) {
      if (index.y + i < 6 && index.x + i < 7 && this.grid[index.y + i][index.x + i] === player) {
        diagonalCount.backUp++;
      } else if (diagonalPrevValue.backUp && diagonalPrevValue.backUp === player) {
        break;
      }
    }
    for (let i = 1; i <= limit - 1; i++) {
      if (index.y + i < 6 && index.x - i > 0 && this.grid[index.y + i][index.x - i] === player) {
        diagonalCount.backDown++;
      } else if (diagonalPrevValue.backDown && diagonalPrevValue.backDown === player) {
        break;
      }
    }

    return (
      1 + diagonalCount.backUp + diagonalCount.forwardDown >= limit ||
      1 + diagonalCount.backDown + diagonalCount.forwardUp >= limit
    );
  }

  /**
   * Get first available cell based on x position
   */
  private getAvailableCell(xIndex: number): null | number {
    for (let i = 5; i >= 0; i--) {
      if (! this.grid[i][xIndex]) {
        return i;
      }
    }

    return null;
  }

  /**
   * Creates a gradient based on player
   */
  private getPlayerGradient(x: number, y: number, player?: Players): CanvasGradient {
    const gradient = this.context.createRadialGradient(x, y - 25, 10, x, y - 25, 70);

    if (player === Players.ONE) {
      gradient.addColorStop(0, '#ff0000');
      gradient.addColorStop(1, '#aa0202');
    } else if (player === Players.TWO) {
      gradient.addColorStop(0, '#0073ff');
      gradient.addColorStop(1, '#02539a');
    } else {
      gradient.addColorStop(0, '#8b8b8b');
      gradient.addColorStop(1, '#5a5a5a');
    }

    return gradient;
  }
}
