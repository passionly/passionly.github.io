var execInterval = 1000;
var execTimerId;

const GRID_COLS = 10;
const GRID_ROWS = 20;

class Player {
  constructor(playground) {
    this.gameOver = false;
    this.playground = playground;
    this.score = this.playground.find('.score');
    this.queueUi = this.playground.find('.queue');

    this.grid = new Array(GRID_ROWS); // holds the grid
    this.cells = new Array(GRID_ROWS); // UI elements of the grid in 2d Array
    this.dropping = null; // the dropping part
    this.queue = [randomPart(), randomPart(), randomPart()]; // queue of 3 future parts
    this.queueUiInvalidated = true;

    for (let r = 0; r < GRID_ROWS; r++) {
      this.grid[r] = new Array(GRID_COLS);
      this.cells[r] = new Array(GRID_COLS);
      for (let c = 0; c < GRID_COLS; c++) {
        this.grid[r][c] = ' ';
        this.cells[r][c] = $('<div class="cell"></div>');
        this.playground.find('.grid').append(this.cells[r][c]);
        this.cells[r][c].css('left', c * 4 + 'vh');
        this.cells[r][c].css('top', r * 4 + 'vh');
      }
    }

    this.cellsUi = this.playground.find('.cell');
  }

  exec() {
    if (this.gameOver) return [];

    let deletedRows = [];

    if (this.dropping == null) {
      let p = this.queue.shift();
      this.queue.push(randomPart());
      this.queueUiInvalidated = true;
      this.dropping = {
        part: p,
        x: Math.floor(5 - p.cols / 2),
        y: 0,
        rotate: 0
      };
      if (!this.canFit()) {
        this.gameOver = true;
      }
    } else {
      this.dropping.y++;
      if (!this.canFit()) {
        this.dropping.y--;
        for (let r = 0; r < this.dropping.part.rows; r++) {
          for (let c = 0; c < this.dropping.part.cols; c++) {
            const droppingCode = this.dropping.part.shape[this.dropping.rotate][r][c];
            if (droppingCode != ' ') {
              this.grid[this.dropping.y + r][this.dropping.x + c] = droppingCode;
            }
          }
        }
        this.dropping = null;
        
        // Check each row, from buttom up.
        for (let r = GRID_ROWS - 1; r >= 0; r--) {
          // See if the row is full
          let rowIsFull = true;
          for (let c = 0; c < GRID_COLS; c++) {
            if (this.grid[r][c] == ' ') rowIsFull = false;
          }
          if (rowIsFull) {
            // If full, extract that row, revert the latest drop to make it ready to be sent to the other player
            let row = this.grid.splice(r, 1)[0];
            for (let c = 0; c < GRID_COLS; c++) {
              if (row[c] != 'g') row[c] = ' ';
            }
            deletedRows.push(row);
          } else {
            // otherwise, solidify the last drop.
            for (let c = 0; c < GRID_COLS; c++) {
              if (this.grid[r][c] != ' ') this.grid[r][c] = 'g';
            }
          }
        }
        for (let i = 0; i < deletedRows.length; i++) {
          let newRow = new Array(GRID_COLS);
          for (let c = 0; c < GRID_COLS; c++) {
            newRow[c] = ' ';
          }
          this.grid.unshift(newRow);
        }
        this.score.text(parseInt(this.score.text()) + Math.pow(2, deletedRows.length) - 1);
      }
    }
    return deletedRows;
  }

  receiveRows(rows) {
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.grid[r][c] != ' ') { // no enough empty space to hold these rows
          this.gameOver = true;
        }
      }
    }
    this.grid.splice(0, rows.length);
    this.grid.push(...rows);
    if (this.dropping != null) {
      this.dropping.y -= rows.length;
      if (this.dropping.y < 0) this.dropping.y = 0;
      if (!this.gameOver && !this.canFit()) {
        this.gameOver = true;
      }
    }
    this.draw();
  }

  canFit() {
    for (let r = 0; r < this.dropping.part.rows; r++) {
      for (let c = 0; c < this.dropping.part.cols; c++) {
        if (this.dropping.part.shape[this.dropping.rotate][r][c] != ' ') {
          let gx = this.dropping.x + c;
          let gy = this.dropping.y + r;
          if (gy < 0 || gy >= GRID_ROWS || gx < 0 || gx >= GRID_COLS || this.grid[gy][gx] != ' ') {
            return false;
          }
        }
      }
    }
    return true;
  }

  draw() {
    for (let code in PARTS) {
      this.cellsUi.removeClass(code);
    }
    this.cellsUi.removeClass('g');

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if ( this.grid[r][c] != ' ') {
          this.cells[r][c].addClass(this.grid[r][c]);
        } else if ( this.dropping != null) {
          let dx = c -  this.dropping.x;
          let dy = r -  this.dropping.y;
          if (dx >= 0 && dy >= 0 && dx < this.dropping.part.cols && dy < this.dropping.part.rows) {
            this.cells[r][c].addClass(this.dropping.part.shape[this.dropping.rotate][dy][dx]);
          }
        }
      }
    }

    if (this.queueUiInvalidated) {
      this.queueUi.empty();
      for (let i = 0; i < this.queue.length; i++) {
        let preview = $('<div class="preview"></div>');
        this.queueUi.append(preview);
        preview.css('width', this.queue[i].cols * 4 + 'vh');
        preview.css('height', this.queue[i].rows * 4 + 'vh');
        for (let r = 0; r < this.queue[i].rows; r++) {
          for (let c = 0; c < 3; c++) {
            let cell = $('<div class="cell"></div>');
            preview.append(cell);
            cell.css('left', c * 4 + 'vh');
            cell.css('top', r * 4 + 'vh');
            if (this.queue[i].shape[0][r][c] != ' ') {
              cell.addClass(this.queue[i].shape[0][r][c]);
            }
          }
        }
      }
      this.queueUiInvalidated = false;
    }

    if (this.gameOver) {
      this.playground.find('.game-over').show();
    }
  }

  move(delta) {
    if (this.dropping == null) return;
    this.dropping.x += delta;
    if (this.canFit()) {
      this.draw();
    } else {
      this.dropping.x -= delta;
    }
  }

  rotate() {
    if (this.dropping == null) return;
    let rotate = this.dropping.rotate;
    this.dropping.rotate = (this.dropping.rotate + 1) % this.dropping.part.shape.length;
    if (this.canFit()) {
      this.draw();
    } else {
      this.dropping.rotate = rotate;
    }
  }
}

var player1, player2;

function onLoad() {
  document.addEventListener('keydown', keyDown);

  player1 = new Player($('#player1'));
  player2 = new Player($('#player2'));

  execTimerId = setInterval(exec, execInterval);
}

function exec() {
  var eliminatedRows1 = player1.exec();
  var eliminatedRows2 = player2.exec();
  player1.receiveRows(eliminatedRows2);
  player2.receiveRows(eliminatedRows1);

  if (player1.gameOver || player2.gameOver) {
    clearTimeout(execTimerId);
  }
}

function sendRowsToOpponent(fromPlayer, rows) {
  (fromPlayer == player1 ? player2 : player1).receiveRows(rows);
}

function keyDown(e) {
  console.log(e);
  if (player1.gameOver || player2.gameOver) return;

  if (e.code == 'ArrowRight') {
    player2.move(1);
  } else if (e.code == 'ArrowLeft') {
    player2.move(-1);
  } else if (e.code == 'ArrowDown') {
    player1.receiveRows(player2.exec());
    player2.draw();
  } else if (e.code == 'ArrowUp') {
    player2.rotate();
  } else if (e.code == 'KeyD') {
    player1.move(1);
  } else if (e.code == 'KeyA') {
    player1.move(-1);
  } else if (e.code == 'KeyS') {
    player2.receiveRows(player1.exec());
    player1.draw();
  } else if (e.code == 'KeyW') {
    player1.rotate();
  }
}
