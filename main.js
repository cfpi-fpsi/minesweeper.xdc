var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);
var field_height = 8;
var field_width = 8;
var initial_mines_count = 10;
var mines_placed = false;
let cut_sound = new Audio("./res/scissor_cut.wav");
let dig_sound = new Audio("./res/dig.wav");
var t0; // When did the player click for the first time?
let game_finished = false; // Not won, just finished.

window.onunload = function() {
    if (!game_finished) {
        localStorage.setItem("minefield", $("#minefield").innerHTML);
        localStorage.setItem("timer", t0);
    } else {
        localStorage.removeItem("minefield");
        localStorage.removeItem("timer");
    }
}

if (localStorage.minefield == null) {
    minefield_initialize();
} else {
    minefield_load();
}

function cell_onclick() {
    if (!mines_placed) {
        place_mines(this.x, this.y);
        t0 = new Date();
    }
    if (this.classList.contains("unknown") && !this.classList.contains("flagged")) {
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
}

function cell_oncontextmenu() {
    if (this.classList.contains("unknown")) {
        this.classList.add("flagged");
        dig_sound.play();
    }
    check_victory();
    return false;
}

function minefield_load() {
    $("#minefield").innerHTML = localStorage.minefield;
    t0 = Date.parse(localStorage.timer);
    for (let i = 0; i < field_height; i++) {
        for (let j = 0; j < field_width; j++) {
            let cell = $("#c" + i + "-" + j);
            cell.onclick = cell_onclick.bind(cell);
            cell.oncontextmenu = cell_oncontextmenu.bind(cell);
        }
    }
}

function minefield_initialize() {
    for (var i = 0; i < field_height; i++) {
        for (var j = 0; j < field_width; j++) {
            var cell = document.createElement("div");
            cell.id = "c" + i + "-" + j;
            cell.x = i;
            cell.y = j;
            cell.classList.add("unknown");

            let r = Math.random();
            if (r < 0.33) {
                cell.classList.add("unknown-type-1");
            } else if (r < 0.66) {
                cell.classList.add("unknown-type-2");
            } else {
                cell.classList.add("unknown-type-3");
            }

            cell.onclick = cell_onclick.bind(cell);
            cell.oncontextmenu = cell_oncontextmenu.bind(cell);
            $("#minefield").appendChild(cell);
        }
    }
}

function place_mines(avoid_x, avoid_y) {
    for (var i = 0; i < initial_mines_count; i++) {
        var x = Math.floor(Math.random() * field_width);
        var y = Math.floor(Math.random() * field_height);
        if (Math.abs(x - avoid_x) <= 1 && Math.abs(y - avoid_y) <= 1) {
            --i;
        } else {
            $("#c" + x + "-" + y).classList.add("mine");
        }
    }
    mines_placed = true;
}

function check_victory() {
    for (var i = 0; i < field_width; ++i) {
        for (var j = 0; j < field_height; ++j) {
            var cell = $("#c" + i + "-" + j);
            if (cell.classList.contains("unknown") && !(cell.classList.contains("flagged") && cell.classList.contains("mine"))) {
                return false;
            }
        }
    }
    // If we get here, we've won
    game_finished = true;
    var time = new Date(new Date() - t0);
    var t = (time.getMinutes() + ":").padStart(2, '0') + ("" + (time.getSeconds())).padStart(2, '0');
    let promise = window.webxdc.sendUpdate({
        payload: {},
        info: window.webxdc.selfName + " cleaned up all the mines in " + t + "!"
    }, window.webxdc.selfName + " won a game of Minesweeper");
    $("#newgame").style.display = "block";
    $("#result").innerText = "Finished in " + t;
    return true;
}

function get_neighbours(cell) {
    var cells = [];
    for (var i = cell.x - 1; i <= cell.x + 1; ++i) {
        for (var j = cell.y - 1; j <= cell.y + 1; ++j) {
            if (i >= 0 && i < field_width && j >= 0 && j < field_height && !(cell.x == i && cell.y == j)) {
                cells.push($("#c" + i + "-" + j));
            }
        }
    }
    return cells;
}

function count_neighbouring_mines(cell) {
    count = 0;
    get_neighbours(cell).forEach(function(c) {
        if (c.classList.contains("mine") || c.classList.contains("exploded")) {
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
        get_neighbours(cell).forEach(function(c) {
            if (c.classList.contains("unknown")) {
                reveal_mines(c);
            }
            if (c.classList.contains("flagged")) {
                c.classList.remove("flagged");
            }
        });
    }
    if (n_mines > 0 && !cell.classList.contains("mine")) {
        cell.innerText = "" + n_mines;
        cell.classList.add("n" + n_mines);
    }
    cut_sound.play();
}

function lose_game() {
    $$("#minefield div").forEach(function(cell) {
        cell.classList.remove("unknown");
        cell.classList.add("known");
        reveal_mines(cell);
        if (cell.classList.contains("exploded")) {
            cell.innerText = "";
        }
    });
    $("#newgame").style.display = "block";
    game_finished = true;
}