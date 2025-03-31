const browserAPI = typeof browser !== "undefined" ? browser : chrome;
const createPin = document.getElementById("createPin");

createPin.addEventListener("click", () => {
	browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		browserAPI.tabs.sendMessage(tabs[0].id, { action: "togglePopup" });
	});
});
