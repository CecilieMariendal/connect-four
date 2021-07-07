import { Grid, Index, Players } from './_@types';
import { board } from './_Board';


export default class Game {
  private readonly canvas = document.querySelector<HTMLCanvasElement>('#myCanvas')!;
  private readonly context = this.canvas.getContext('2d')!;

  private readonly board = new board();

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
  private gameMode: 'singlePlayer' | 'multiplayer' = 'singlePlayer';
  private currentPlayer = Players.ONE


  startGame() {
    document.addEventListener('mousemove', this.updateMarker.bind(this));
    this.canvas.addEventListener('click', this.takeTurn.bind(this));

    this.board.drawBoard(this.grid);
  }


  stopGame() {
    document.removeEventListener('mousemove', this.updateMarker);
    this.canvas.removeEventListener('click', this.takeTurn);
  }


  private updateMarker(event: MouseEvent) {
    const indexX = Math.floor((event.clientX - this.canvas.offsetLeft) / 100);
    let positionX = indexX * 100 + 50;

    if (event.clientX < this.canvas.offsetLeft + 50) {
      positionX = 50;
    } else if ( event.clientX >
      this.canvas.offsetLeft + this.canvas.width - 50
    ) {
      positionX = this.canvas.width - 50;
    }

    this.board.drawMarker(positionX, Boolean(this.getAvailableCell(indexX)), this.currentPlayer);
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

      this.updateMarker(event);
      this.board.drawBoard(this.grid);

      const streak = this.checkIfStreak(this.currentPlayer);
      if (streak.length >= 4) {
        this.board.drawWinner(this.currentPlayer, streak);
      } else {
        if (this.gameMode === 'singlePlayer') {
          this.computerTurn();
        } else {
          this.switchCurrentPlayer();
        }
      }
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
      if (blueWouldWin.length >= 4) {
        this.grid[y][x] = Players.TWO;
        this.previousIndex.push({y,x});
        this.lastIndex = {y,x};

        if (blueWouldWin) {
          this.board.drawWinner(Players.TWO, blueWouldWin);
          this.stopGame();
        }

        return;
      }

      const redWouldWin = this.checkIfStreak(Players.ONE, 3, {y,x});
      if (redWouldWin.length >= 4) {
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
      if (this.checkIfStreak(Players.TWO, 3, { y, x }).length > 3) {
        value += 2;
      }

      // Can i get 2 in a row
      if (this.checkIfStreak(Players.TWO, 2, { y, x }).length > 2) {
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
  private checkIfStreak(player: Players, limit = 4, index = this.lastIndex!): Index[] {
    const horizontal = [];
    let horizontalPrevValue;

    for (let i = 0; i < this.grid[index.y].length; i++) {
      if (this.grid[index.y][i] === player) {
        horizontal.push({x: i, y: index.y});
        
        if (horizontal.length >= limit) {
          return horizontal;
        }
      } else if (horizontalPrevValue === player) {
        break;
      }
      
      horizontalPrevValue = this.grid[index.y][i];
    }

    const vertical = [];
    let verticalPrevValue;
    for (let y = 0; y < this.grid.length; y++) {
      if (this.grid[y][index.x] === player) {
        vertical.push({x: index.x, y});

        if (vertical.length >= limit) {
          return vertical;
        }
      } else if (verticalPrevValue && verticalPrevValue === player) {
        break;
      }

      verticalPrevValue = this.grid[y][index.x];
    }

    const diagonalCount: {[key: string]: Index[]} = {
      forwardUp: [],
      forwardDown: [],
      backUp: [],
      backDown: [],
    };

    const diagonalPrevValue = {
      forwardUp: null,
      forwardDown: null,
      backUp: null,
      backDown: null,
    };

    for (let i = 1; i <= limit - 1; i++) {
      if (index.y - i > 0 && index.x + i < 7 && this.grid[index.y - i][index.x + i] === player) {
        diagonalCount.forwardUp.push({x: index.x, y: index.y});
      } else if (diagonalPrevValue.forwardUp && diagonalPrevValue.forwardUp === player) {
        break;
      }
    }

    for (let i = 1; i <= limit - 1; i++) {
      if (index.y - i > 0 && index.x - i > 0 && this.grid[index.y - i][index.x - i] === player) {
        diagonalCount.forwardDown.push({x: index.x, y: index.y});
      } else if (diagonalPrevValue.forwardDown && diagonalPrevValue.forwardDown === player) {
        break;
      }
    }
    for (let i = 1; i <= limit - 1; i++) {
      if (index.y + i < 6 && index.x + i < 7 && this.grid[index.y + i][index.x + i] === player) {
        diagonalCount.backUp.push({x: index.x, y: index.y});
      } else if (diagonalPrevValue.backUp && diagonalPrevValue.backUp === player) {
        break;
      }
    }
    for (let i = 1; i <= limit - 1; i++) {
      if (index.y + i < 6 && index.x - i > 0 && this.grid[index.y + i][index.x - i] === player) {
        diagonalCount.backDown.push({x: index.x, y: index.y});
      } else if (diagonalPrevValue.backDown && diagonalPrevValue.backDown === player) {
        break;
      }
    }

    const dialognal1 = [...diagonalCount.backUp, ...diagonalCount.forwardDown];
    const dialognal2 = [...diagonalCount.backDown, ...diagonalCount.forwardUp];
    if (1 + dialognal1.length >= limit) {
      return dialognal1;
    } else if (1 + dialognal2.length >= limit) {
      return dialognal2;
    }

    return [];
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
}
