var point = require('./point.js');

exports.PlayerCharacter = function(username) {
	this.username = username;
	this.health = 100;
	this.is_moving = false;
	this.direction =  new point.Point(0,1);
	this.position = new point.Point(576,280);
}


// North ( 0,  1)
// South ( 0, -1)
// East  ( 1,  0)
// West  (-1,  0)