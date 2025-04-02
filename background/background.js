const browserAPI = typeof browser !== "undefined" ? browser : chrome;

browserAPI.runtime.onInstalled.addListener(() => {
	incrementBadge();
	browserAPI.contextMenus.create({
		id: "selected_new_pin",
		title: "選択した文字列をピンに追加",
		contexts: ["selection"],
	});
});

browserAPI.commands.onCommand.addListener((command) => {
	if (command === "toggle-popup") {
		browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			browserAPI.tabs.sendMessage(tabs[0].id, { action: "createPopup" });
		});
	}
});

browserAPI.contextMenus.onClicked.addListener((info, tab) => {
	const content = info.selectionText;
	if (content) {
		browserAPI.tabs.sendMessage(tab.id, {
			action: "savePin",
			content: content,
		});
	}
});

browserAPI.runtime.onMessage.addListener((message) => {
	if (message.action === "incrementBadge") {
		incrementBadge();
	}
});

function incrementBadge() {
	browserAPI.storage.local.get(["pins"], (result) => {
		try {
			const pinCount = Array.isArray(result?.pins)
				? result.pins.length
				: 0;
			if (pinCount > 0) {
				browserAPI.action.setBadgeText({ text: pinCount.toString() });
			} else {
				browserAPI.action.setBadgeText({ text: "" });
			}
		} catch (error) {
			console.error("Error updating badge:", error);
		}
	});
}
