var io = require('socket.io').listen(9000);
var pc = require('./character.js');


io.set('log level', 1);

var users = [];

io.sockets.on('connection', function (socket) {
	socket.on('join', function(username, callback) {
		if (users.indexOf(username) < 0) {
			socket.username = username;
			users.push(username);
			socket.broadcast.emit('user-joined', username);
			callback(true, users);
		} else {
			callback(false);
		}
	});

	socket.on("chat", function(message) {
		if (socket.username && message) {
			io.sockets.emit("chat", {sender: socket.username, message: message});
		}
	});

	socket.on('disconnect', function() {
		if (socket.username) {
			users.splice(users.indexOf(socket.username), 1);
			io.sockets.emit('user-left', socket.username);
		}
	});
});