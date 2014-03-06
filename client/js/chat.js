$(function() {
	var socket = io.connect("");
	socket.on(
		"event",
		function(event) {
			console.log(event);
			View[event.action](event);
		}
	);

	var chat = $("#chat");
	var sidebar = $("#sidebar");
	
	// Templates
	var networks = $("#networks").html();
	var channels = $("#channels").html();
	var messages = $("#messages").html();
	var users = $("#users").html()

	var View = {};

	View.refresh = function(event) {
		var data = event.data;

		sidebar.html(
			Mustache.render(networks, {
				networks: data
			})
		);

		chat.html("");
		var partials = {
			users: users,
			messages: messages
		};
		data.forEach(function(network) {
			chat.append(Mustache.render(channels, network, partials));
		});

		chat.find(".messages").scrollToBottom();
		chat.find(".window")
			// Sort windows by `data-id` value.
			.sort(function(a, b) { return ($(a).data("id") - $(b).data("id")); })
			.last()
			.bringToTop()
			.find(".input")
				.focus();
	};

	View.add = function(event) {
		var target = "";
		var render = "";

		switch (event.type) {
		case "user":
			target = ".users";
			render = Mustache.render(
				users, {users: event.data}
			);
			break;

		case "message":
			target = ".messages";
			render = Mustache.render(
				messages, {messages: event.data}
			);
			break;
		}

		if (target != "") {
			target = $("[data-id='" + event.target + "'] " + target);
			var keepAtBottom = target.isScrollBottom();
			target.append(render);
			if (keepAtBottom) {
				target.scrollToBottom();
			}
		}
	};

	View.remove = function(event) {
		$("[data-id='" + event.target + "']").remove();
	};

	View.change = function(event) {
		// ..
	};

	chat.on("submit", "form", function() {
		var input = $(this).find(".input");
		var text = input.val();
		if (text != "") {
			input.val("");
			socket.emit("input", {
				id: input.data("target"),
				text: text
			});
		}
	});

	sidebar.on("click", ".channel", function() {
		chat.find(".window[data-id='" + $(this).data("id") + "']")
			.bringToTop();
	});
});


(function() {
	var highest = 1;
	$.fn.bringToTop = function() {
		return this.css('z-index', highest++);
	};

	$.fn.scrollToBottom = function() {
		return this.scrollTop(this.prop("scrollHeight"));
	};

	$.fn.isScrollBottom = function() {
		var height = this.outerHeight();
		var scroll = this.scrollTop();
		if ((scroll + height + 5) >= this.prop("scrollHeight")) {
			return true;
		}
	};
})();