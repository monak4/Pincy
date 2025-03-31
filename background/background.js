const browserAPI = typeof browser !== "undefined" ? browser : chrome;

console.log("debug");

browserAPI.commands.onCommand.addListener((command) => {
	console.log("debug Toggling the feature!");
	if (command === "toggle-popup") {
		console.log("Toggling the feature!");
	}
});
