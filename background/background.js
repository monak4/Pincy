const browser = typeof browser !== "undefined" ? browser : chrome;

browser.commands.onCommand.addListener((command) => {
	if (command === "toggle-feature") {
		console.log("Toggling the feature!");
	}
});
