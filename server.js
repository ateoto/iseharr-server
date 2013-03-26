var WebSocketServer = require('ws').Server;
var pc = require('./character.js');
var bison = require('bison');
var uuid = require('node-uuid');

var wss = new WebSocketServer({port: 8080, path: '/socket'});
var users = [];
var current_users = 0;
var max_users = 4;
var start_tick = Date.now();
var current_tick = Date.now();
var last_tick = Date.now();
var tickcount;

debug_pos = function() {
    for (var i = 0; i < current_users; i++) {
        users[i].socket.send(JSON.stringify({'type': 'position-update', 'data': {'position': users[i].position}}));
    }
}

ping = function() {
    for (var i = 0; i < current_users; i++) {
        //console.log('Sent', users[i].username, tickcount);
        users[i].socket.send(JSON.stringify({'type': 'ping', 'data': {'ping': users[i].ping, 'tickcount': tickcount}}));
    }
}

showlatency = function() {
    for (var i = 0; i < current_users; i++) {
        //var length = users[i].pings.length;
        //var total = users[i].pings.reduce(function(a,b) { return a + b; }, 0);
        //var average = total / length;
        //users[i].latency = average;
        console.log(users[i].username, 'Latency:', users[i].ping + 'ms');
    }    
}

tick = function() {
    current_tick = Date.now();
    tickcount = current_tick - start_tick;
    var dt = current_tick - last_tick;
    // Loop through the Users, determine proximity to NPCs and each other.
    // Process events and other things.
    // Not really sure.
    for (var i = 0; i < current_users; i++) {
        if (users[i].is_moving) {
            users[i].position.x = (users[i].position.x + (users[i].direction.x * users[i].speed * dt));
            users[i].position.y = (users[i].position.y + (users[i].direction.y * users[i].speed * dt));  
        }
    }
    last_tick = current_tick;
    //console.log('Time since start:',current_tick - start_tick);
    //console.log(dt);
}

get_user_by_uuid = function(uuid) {
    for (var i = 0; i < current_users; i++) {
        if (users[i].uuid === uuid) {
            return users[i];
        }
    }
}

setInterval(tick, 16); // This runs at 60 Ticks per second. Not sure if it can keep up at this point.
setInterval(debug_pos, 500);
setInterval(showlatency, 10000);
setInterval(ping, 5000);


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
            user.client_time = msg.data.time;
            user.tickcount = msg.data.tickcount;
            user.client_time_update = tickcount;
            user.uuid = uuid.v4();
            user.ping = 0;
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

        if (msg.type === 'player-startmove') {
            var user = get_user_by_uuid(msg.data.uuid);
            user.is_moving = true;
            user.direction = msg.data.direction;
            user.speed = msg.data.speed;
        }
        if (msg.type === 'player-stopmove') {
            var user = get_user_by_uuid(msg.data.uuid);
            user.is_moving = false;
        }

        if (msg.type === 'time-check') {
            var user = get_user_by_uuid(msg.data.uuid);
            user.client_time = msg.data.time;
            user.tickcount = msg.data.tickcount;
            user.client_time_update = tickcount;
            user.latency = user.pred_tickcount - user.tickcount;
            console.log(user.tickcount, user.pred_tickcount, user.latency);
        }
        if (msg.type === 'pong') {
            var user = get_user_by_uuid(msg.data.uuid);
            user.ping = tickcount - msg.data.tickcount;
            //console.log(user.username, 'sent back',msg.data.tickcount,'at',tickcount);
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