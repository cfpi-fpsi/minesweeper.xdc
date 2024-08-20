var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);
var field_height = 8;
var field_width = 8;
var initial_mines_count = 10;
var mines_placed = false;

for (var i = 0; i < field_height; i++) {
  var row = document.createElement("tr");
  for (var j = 0; j < field_width; j++) {
    var cell = document.createElement("td");
    cell.id = "c"+i+"-"+j;
    cell.x = i;
    cell.y = j;
    cell.classList.add("unknown");
    cell.onclick = function() {
      if (! mines_placed) {
        place_mines(this.x, this.y);
      }
      if (this.classList.contains("unknown") && ! this.classList.contains("flagged")) {
        if (this.classList.contains("mine")) {
          this.classList.remove("mine");
          this.classList.add("exploded");
          lose_game();
          return;
        } else {
          reveal_mines(this);
        }
        check_victory();
      } else if (this.classList.contains("flagged")) {
        this.classList.remove("flagged");
      }
    }.bind(cell);
    cell.oncontextmenu = function() {
      if (this.classList.contains("unknown")) {
        this.classList.add("flagged");
      }
      check_victory();
      return false;
    }
    row.appendChild(cell);
  }
  $("#minefield").appendChild(row);
}

function place_mines(avoid_x, avoid_y) {
  for (var i = 0; i < initial_mines_count; i++) {
    var x = Math.floor(Math.random() * field_width);
    var y = Math.floor(Math.random() * field_height);
    if (Math.abs(x - avoid_x) <= 1 && Math.abs(y - avoid_y) <= 1) {
      --i;
    } else {
      $("#c"+x+"-"+y).classList.add("mine");
    }
  }
  mines_placed = true;
}

function check_victory() {
  for (var i = 0; i < field_width; ++i) {
    for (var j = 0; j < field_height; ++j) {
      var cell = $("#c"+i+"-"+j);
      if (cell.classList.contains("unknown") && ! (cell.classList.contains("flagged") && cell.classList.contains("mine"))) {
        return false;
      }
    }
  }
  let promise = window.webxdc.sendUpdate({
    payload : {},
    info : window.webxdc.selfName + " cleaned up all the mines!"
  }, window.webxdc.selfName + " won a game of Minesweeper");
  $("#newgame").style.display = "block";
  return true;
}

function get_neighbours(cell) {
  var cells = [];
  for (var i = cell.x-1; i <= cell.x+1; ++i) {
    for (var j = cell.y-1; j <= cell.y+1; ++j) {
      if (i >= 0 && i < field_width && j >= 0 && j < field_height && ! (cell.x == i && cell.y == j)) {
        cells.push($("#c"+i+"-"+j));
      }
    }
  }
  return cells;
}

function count_neighbouring_mines(cell) {
  count = 0;
  get_neighbours(cell).forEach(function (c) {
    if (c.classList.contains("mine")) {
      count += 1;
    }
  })
  return count;
}

function reveal_mines(cell) {
  var n_mines = count_neighbouring_mines(cell);
  cell.classList.remove("unknown");
  cell.classList.add("known");
  if (n_mines == 0) {
    get_neighbours(cell).forEach( function (c) {
      if (c.classList.contains("unknown")) {
        reveal_mines(c);
      }
      if (c.classList.contains("flagged")) {
        c.classList.remove("flagged");
      }
    });
  }
  if (n_mines > 0) {
    cell.innerHTML = ""+n_mines;
    cell.classList.add("n"+n_mines);
  }
}

function lose_game() {
  $$("#minefield td").forEach(function (cell) {
    cell.classList.remove("unknown");
    cell.classList.add("known");
  });
  $("#newgame").style.display = "block";
}
