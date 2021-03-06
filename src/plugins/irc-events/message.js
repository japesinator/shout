var _ = require("lodash");
var PushBullet = require('pushbullet');
var Helper = require("../../helper");
var Chan = require("../../models/chan");
var Msg = require("../../models/msg");

module.exports = function(irc, network) {
	var client = this;
	var config = Helper.getConfig();
	irc.on("message", function(data) {
		if (data.message.indexOf("\u0001") === 0 && data.message.substring(0, 7) != "\u0001ACTION") {
			// Hide ctcp messages.
			return;
		}

		var target = data.to;
		if (target.toLowerCase() == irc.me.toLowerCase()) {
			target = data.from;
		}

		var chan = _.findWhere(network.channels, {name: target});
		if (typeof chan === "undefined") {
			chan = new Chan({
				type: Chan.Type.QUERY,
				name: data.from
			});
			network.channels.push(chan);
			client.emit("join", {
				network: network.id,
				chan: chan
			});
		}

		var type = "";
		var text = data.message;
		if (text.split(" ")[0] === "\u0001ACTION") {
			type = Msg.Type.ACTION;
			text = text.replace(/^\u0001ACTION|\u0001$/g, "");
		}

		text.split(" ").forEach(function(w) {
			if (w.toLowerCase().indexOf(irc.me.toLowerCase()) === 0) {
				type += " highlight";
				if (irc.me in config.pushtokens && chan.id != client.activeChannel) {
					var pusher = new PushBullet(config.pushtokens[irc.me]);
					pusher.note( ''
					           , "Someone's talking to you on IRC!"
					           , "<" + data.from + ">: " + text
					           , function(error, response) {}
					           );
				}
			}
		});

		var self = false;
		if (data.from.toLowerCase() == irc.me.toLowerCase()) {
			self = true;
		}

		if (chan.id != client.activeChannel) {
			chan.unread++;
		}

		var name = data.from;
		var msg = new Msg({
			type: type || Msg.Type.MESSAGE,
			mode: chan.getMode(name),
			from: name,
			text: text,
			self: self
		});
		chan.messages.push(msg);
		client.emit("msg", {
			chan: chan.id,
			msg: msg
		});
	});
};
