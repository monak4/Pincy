const browserAPI = typeof browser !== "undefined" ? browser : chrome;

browserAPI.runtime.onInstalled.addListener(() => {
	incrementBadge();
	setupContextMenu();
});

browserAPI.commands.onCommand.addListener((command) => {
	if (command === "toggle-popup") {
		browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			browserAPI.tabs.sendMessage(tabs[0].id, { action: "createPopup" });
		});
	}
});

function setupContextMenu() {
	// 設定を取得してコンテキストメニューの状態を設定
	browserAPI.storage.local.get(["settings"], (result) => {
		const settings = result.settings || {};
		const enableContextMenu =
			settings.enableContextMenu !== undefined
				? settings.enableContextMenu
				: true; // デフォルトはtrue

		// 一旦削除
		browserAPI.contextMenus.removeAll(() => {
			// 有効な場合のみ作成
			if (enableContextMenu) {
				browserAPI.contextMenus.create({
					id: "selected_new_pin",
					title: "選択した文字列をピンに追加",
					contexts: ["selection"],
				});
			}
		});
	});
}

browserAPI.contextMenus.onClicked.addListener((info, tab) => {
	const content = info.selectionText;
	if (content) {
		savePin(content, generateId());
	}
});

browserAPI.runtime.onMessage.addListener((message) => {
	if (message.action === "incrementBadge") {
		incrementBadge();
	} else if (message.action === "savePin") {
		savePin(message.content, message.id);
	} else if (message.action === "updateContextMenu") {
		setupContextMenu();
	}
});

function savePin(content, id) {
	browserAPI.storage.local.get(["pins", "settings"], function (result) {
		const pins = result.pins || [];
		const settings = result.settings || {};
		const maxPins = settings.maxPins || 100; // デフォルトは100
		const timestamp = Date.now();

		const existingIndex = pins.findIndex((pin) => pin.id === id);

		if (existingIndex >= 0) {
			pins[existingIndex].content = content;
			pins[existingIndex].updatedAt = timestamp;
		} else {
			// 最大数を超える場合は古いものを削除
			if (pins.length >= maxPins) {
				// 日付でソートして古いものを削除
				pins.sort((a, b) => a.updatedAt - b.updatedAt);
				pins.shift(); // 最も古いものを削除
			}

			pins.push({
				id: id,
				content: content,
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		}

		browserAPI.storage.local.set({ pins: pins }, function () {
			browserAPI.tabs.query(
				{ active: true, currentWindow: true },
				(tabs) => {
					browserAPI.tabs.sendMessage(tabs[0].id, {
						action: "showSaveConfirmation",
					});
				}
			);
			incrementBadge();
			browserAPI.runtime.sendMessage({ action: "loadSavedPins" });
		});
	});
}

function generateId() {
	return (
		"pin_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now()
	);
}

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
