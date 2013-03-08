var io = require('socket.io').listen(9000);
var pc = require('./character.js');


io.set('log level', 1);

var users = [];

var last_tick = Date.now();

tick = function() {
	var current_tick = Date.now();
	// Currently, nothing.
	last_tick = current_tick;
}

setInterval(tick, 10);

io.sockets.on('connection', function (socket) {
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
			//Sanitize coordinate input
			socket.pc.position.x = coordinates.x;
			socket.pc.position.y = coordinates.y;
			io.sockets.emit("pc-move-ack", { pc: socket.pc });
		}
	});

	socket.on("chat", function(message) {
		if (socket.username && message) {
			io.sockets.emit("chat", {sender: socket.username, message: message});
		}
	});

	socket.on('disconnect', function() {
		if (socket.username) {
			users.splice(users.indexOf(socket.pc), 1);
			console.log('User left: ' + socket.pc.username);
			io.sockets.emit('user-left', {pc: socket.pc});
		}
	});
});