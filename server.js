var WebSocketServer = require('ws').Server;
var pc = require('./character.js');
var bison = require('bison');
var uuid = require('node-uuid')

var wss = new WebSocketServer({port: 8080, path: '/socket'});
var users = [];
var current_users = 0;
var max_users = 4;
var last_tick = Date.now();

tick = function() {
    var current_tick = Date.now();
    // Loop through the Users, determine proximity to NPCs and each other.
    // Process events and other things.
    // Not really sure.
    for (var i = 0; i < current_users; i++) {}
    last_tick = current_tick;
}

setInterval(tick, 10); // This runs at 100 Ticks per second. Not sure if it can keep up at this point.

wss.on('connection', function(ws) {
    if (current_users >= max_users) {
        ws.send(JSON.stringify({ 'type': 'connect-fail', 'data': {'reason': 'Server Full'}}));
        ws.close();
    }

    ws.on('message', function(message) {
        // This is where we determine what kind of message it is. If it's a connect message,
        // add the user to the list.

        var msg = JSON.parse(message);
        if (msg.type === 'connect') {
            var user = new pc.PlayerCharacter(msg.data.username);
            user.position.x = msg.data.position.x;
            user.position.y = msg.data.position.y;
            user.socket = ws;
            user.uuid = uuid.v4();
            users.push(user);
            current_users += 1;
            user.socket.send(JSON.stringify({'type': 'connect-ack', 'data':{'uuid':user.uuid}}));
            //console.log(user.username, 'joined.');
        }

        if (msg.type === 'chat') {
            for (var i = 0; i < current_users; i++) {
                users[i].socket.send(JSON.stringify(msg));
            }
        }
    });

    ws.on('close', function(){
        // I guess for now loop through the users and see if thier sockets are the same as ws.
        for (var i = 0; i < current_users; i++) {
            if (users[i].socket == ws) {
                user = users.splice(i, 1);
                current_users -= 1;
                //console.log(user[0].username, 'left.');
                break;
            }
        }
    });
});