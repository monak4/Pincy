const browserAPI = typeof browser !== "undefined" ? browser : chrome;

browserAPI.commands.onCommand.addListener((command) => {
	if (command === "toggle-popup") {
		browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			browserAPI.tabs.sendMessage(tabs[0].id, { action: "togglePopup" });
		});
	}
});
