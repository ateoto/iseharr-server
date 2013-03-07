var point = require('./point.js');

exports.PlayerCharacter = function(username) {
	this.username = username;
	this.health = 100;
	this.position = new point.Point(576,280);
}
