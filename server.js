var io = require('socket.io').listen(8080);
var pc = require('./character.js');
var bison = require('bison');


//io.set('log level', 1);

var users = [];

var last_tick = Date.now();

tick = function() {
    var current_tick = Date.now();
    // Currently, nothing.
    last_tick = current_tick;
}

setInterval(tick, 10);

var main_socket = io.of('/socket').on('connection', function(socket) {
    socket.on('join', function(username, callback) {
        if (users.indexOf(username) < 0) {
            socket.username = username;
            socket.pc = new pc.PlayerCharacter(socket.username);
            users.push(socket.pc);
            socket.broadcast.emit('user-joined', { pc: socket.pc });
            console.log('User Joined: ' + socket.pc.username);
            callback(true, users);
        } else {
            callback(false);
        }
    });

    socket.on('pc-move', function(coordinates) {
        if (socket.pc && coordinates) {
            socket.pc.position.x = coordinates.x;
            socket.pc.position.y = coordinates.y;
            main_socket.emit('pc-move-ack', { pc: socket.pc });
        }
    });

    socket.on('chat', function(message) {
        if (socket.username && message) {
            socket.broadcast.emit('chat', { sender: socket.username, message: message });
        }
    });

    socket.on('disconnect', function() {
        if (socket.username) {
            users.splice(users.indexOf(socket.pc), 1);
            console.log('User left: ' + socket.pc.username);
            main_socket.emit('user-left', { pc: socket.pc });
        }
    });
});
