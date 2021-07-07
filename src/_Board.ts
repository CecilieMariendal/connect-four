import { Grid, Index, Players } from './_@types';

export class board {
  private readonly canvas = document.querySelector<HTMLCanvasElement>('#myCanvas')!;
  private readonly context = this.canvas.getContext('2d')!;


  /**
   * Erases current board and draws new board based on grid
   */
  drawBoard(grid: Grid): void {
    this.context.clearRect(0, 100, this.canvas.width, this.canvas.height - 100);

    // Draw circles
    grid.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        const x = 100 / 2 + 100 * columnIndex;
        const y = 100 + 100 / 2 + 100 * rowIndex;

        this.context.beginPath();
        this.context.arc(x, y, 100 / 2 - 5, 0, 2 * Math.PI);

        this.context.fillStyle = typeof value === 'string' ? this.getPlayerGradient(x, y, value) : 'white';
        this.context.fill();
      });
    });
  }


  
  /**
   * Draws marker based on mouse position
   */
  drawMarker(positionX: number, cellAvailable: boolean, player: Players): void {
    this.context.beginPath();
    this.context.clearRect(0, 0, this.canvas.width, 100);
    this.context.arc(positionX, 50, 100 / 2 - 5, 0, 2 * Math.PI);

    if (cellAvailable) {
      this.context.fillStyle = this.getPlayerGradient(positionX, 50, player);
    } else {
      this.context.fillStyle = this.getPlayerGradient(positionX, 50);
    }
    
    this.context.fill();
  }


  drawWinner(player: Players, streak: Index[]): void {
    streak.forEach(({x, y}) => {
      console.log(x, y);
      
      const xCalced = 100 / 2 + 100 * x;
      const yCalced = 100 + 100 / 2 + 100 * y;

      this.context.beginPath();
      this.context.arc(xCalced, yCalced, 100 / 2 - 5, 0, 2 * Math.PI);

      this.context.fillStyle = 'green';
      this.context.fill();
    });

    const text = player.charAt(0).toUpperCase() + player.slice(1) + ' wins!!';
    this.context.font = '60px sans-serif';
    this.context.textAlign = 'center';

    this.context.strokeStyle = 'white';
    this.context.lineWidth = 8;
    this.context.strokeText(text, 350, 400);

    this.context.fillStyle = player;
    this.context.fillText(text, 350, 400);
  }


  /**
   * Creates a gradient based on player
   */
  getPlayerGradient(x: number, y: number, player?: Players): CanvasGradient {
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