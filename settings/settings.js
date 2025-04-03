const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// デフォルト
const DEFAULT_SETTINGS = {
	defaultColor: "#fdff79",
	defaultWidth: 300,
	defaultHeight: 200,
	fontSize: "medium",
	autosave: false,
	saveInterval: 60,
	enableContextMenu: true,
	maxPins: 100,
};

const defaultColorInput = document.getElementById("defaultColor");
const colorValueDisplay = document.querySelector(".color-value");
const defaultWidthInput = document.getElementById("defaultWidth");
const defaultHeightInput = document.getElementById("defaultHeight");
const fontSizeSelect = document.getElementById("fontSize");
const autosaveToggle = document.getElementById("autosave");
const saveIntervalSelect = document.getElementById("saveInterval");
const enableContextMenuToggle = document.getElementById("enableContextMenu");
const maxPinsSelect = document.getElementById("maxPins");
const exportDataBtn = document.getElementById("exportData");
const importDataBtn = document.getElementById("importData");
const importFileInput = document.getElementById("importFile");
const clearDataBtn = document.getElementById("clearData");
const resetDefaultsBtn = document.getElementById("resetDefaults");
const saveSettingsBtn = document.getElementById("saveSettings");
const changeShortcutLink = document.getElementById("changeShortcut");
const overlay = document.getElementById("overlay");
const dialogMessage = document.getElementById("dialogMessage");
const cancelDialogBtn = document.getElementById("cancelDialog");
const confirmDialogBtn = document.getElementById("confirmDialog");

function loadSettings() {
	browserAPI.storage.local.get(["settings"], (result) => {
		const settings = result.settings || DEFAULT_SETTINGS;

		// セット
		defaultColorInput.value =
			settings.defaultColor || DEFAULT_SETTINGS.defaultColor;
		colorValueDisplay.textContent =
			settings.defaultColor || DEFAULT_SETTINGS.defaultColor;
		defaultWidthInput.value =
			settings.defaultWidth || DEFAULT_SETTINGS.defaultWidth;
		defaultHeightInput.value =
			settings.defaultHeight || DEFAULT_SETTINGS.defaultHeight;
		fontSizeSelect.value = settings.fontSize || DEFAULT_SETTINGS.fontSize;
		autosaveToggle.checked = settings.autosave || DEFAULT_SETTINGS.autosave;
		saveIntervalSelect.value =
			settings.saveInterval || DEFAULT_SETTINGS.saveInterval;
		enableContextMenuToggle.checked =
			settings.enableContextMenu !== undefined
				? settings.enableContextMenu
				: DEFAULT_SETTINGS.enableContextMenu;
		maxPinsSelect.value = settings.maxPins || DEFAULT_SETTINGS.maxPins;

		// 自動保存の設定に応じて間隔の設定を表示/非表示
		updateAutosaveVisibility();
	});
}

// 自動保存の設定に応じて間隔の設定を表示/非表示
function updateAutosaveVisibility() {
	const saveIntervalLabel = document.querySelector(
		'label[for="saveInterval"]'
	);
	if (autosaveToggle.checked) {
		saveIntervalLabel.style.display = "block";
		saveIntervalSelect.style.display = "block";
	} else {
		saveIntervalLabel.style.display = "none";
		saveIntervalSelect.style.display = "none";
	}
}

function saveSettings() {
	const settings = {
		defaultColor: defaultColorInput.value,
		defaultWidth: parseInt(defaultWidthInput.value),
		defaultHeight: parseInt(defaultHeightInput.value),
		fontSize: fontSizeSelect.value,
		autosave: autosaveToggle.checked,
		saveInterval: parseInt(saveIntervalSelect.value),
		enableContextMenu: enableContextMenuToggle.checked,
		maxPins: parseInt(maxPinsSelect.value),
	};

	browserAPI.storage.local.set({ settings }, () => {
		showNotification("設定を保存しました");
		updateContextMenuState(settings.enableContextMenu);
	});
}

// コンテキストメニューの有効/無効を切り替え
function updateContextMenuState(enabled) {
	if (enabled) {
		browserAPI.contextMenus.create({
			id: "selected_new_pin",
			title: "選択した文字列をピンに追加",
			contexts: ["selection"],
		});
	} else {
		browserAPI.contextMenus.remove("selected_new_pin");
	}
}

function resetToDefaults() {
	showDialog("すべての設定をデフォルトに戻しますか？", () => {
		browserAPI.storage.local.set({ settings: DEFAULT_SETTINGS }, () => {
			loadSettings();
			showNotification("設定をデフォルトに戻しました");
		});
	});
}

function exportData() {
	browserAPI.storage.local.get(["pins", "settings"], (result) => {
		const data = {
			pins: result.pins || [],
			settings: result.settings || DEFAULT_SETTINGS,
			exportDate: new Date().toISOString(),
		};

		const blob = new Blob([JSON.stringify(data)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `pincy_backup_${new Date()
			.toISOString()
			.slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);

		showNotification("データのエクスポートが完了しました");
	});
}

function importData(file) {
	const reader = new FileReader();
	reader.onload = (e) => {
		try {
			const data = JSON.parse(e.target.result);

			if (!data.pins || !Array.isArray(data.pins)) {
				throw new Error("無効なデータ形式です");
			}

			showDialog(
				"インポートすると現在のデータが上書きされます。続行しますか？",
				() => {
					browserAPI.storage.local.set(
						{
							pins: data.pins,
							settings: data.settings || DEFAULT_SETTINGS,
						},
						() => {
							loadSettings();
							showNotification(
								"データのインポートが完了しました"
							);
						}
					);
				}
			);
		} catch (error) {
			showNotification(
				"データのインポートに失敗しました: " + error.message,
				true
			);
		}
	};
	reader.readAsText(file);
}

function clearAllData() {
	showDialog(
		"すべてのメモと設定を削除します。この操作は元に戻せません。続行しますか？",
		() => {
			browserAPI.storage.local.clear(() => {
				loadSettings();
				showNotification("すべてのデータを削除しました");
			});
		}
	);
}

function showDialog(message, confirmCallback) {
	dialogMessage.textContent = message;
	overlay.classList.remove("hidden");

	// イベントリスナーをリセット
	const newCancelBtn = cancelDialogBtn.cloneNode(true);
	const newConfirmBtn = confirmDialogBtn.cloneNode(true);
	cancelDialogBtn.parentNode.replaceChild(newCancelBtn, cancelDialogBtn);
	confirmDialogBtn.parentNode.replaceChild(newConfirmBtn, confirmDialogBtn);

	// 新しいイベントリスナーを設定
	newCancelBtn.addEventListener("click", () => {
		overlay.classList.add("hidden");
	});

	newConfirmBtn.addEventListener("click", () => {
		overlay.classList.add("hidden");
		confirmCallback();
	});
}

function showNotification(message, isError = false) {
	const notification = document.createElement("div");
	notification.textContent = message;
	notification.style.position = "fixed";
	notification.style.bottom = "20px";
	notification.style.right = "20px";
	notification.style.backgroundColor = isError ? "#ff6b6b" : "#4CAF50";
	notification.style.color = "white";
	notification.style.padding = "10px 20px";
	notification.style.borderRadius = "4px";
	notification.style.zIndex = "1000";

	document.body.appendChild(notification);

	setTimeout(() => {
		notification.style.opacity = "0";
		notification.style.transition = "opacity 0.5s";
		setTimeout(() => {
			notification.remove();
		}, 500);
	}, 3000);
}

function openShortcutSettings() {
	browserAPI.tabs.create({
		url: "chrome://extensions/shortcuts",
	});
}

// リスナーの設定
document.addEventListener("DOMContentLoaded", loadSettings);

defaultColorInput.addEventListener("input", () => {
	colorValueDisplay.textContent = defaultColorInput.value;
});

autosaveToggle.addEventListener("change", updateAutosaveVisibility);

saveSettingsBtn.addEventListener("click", saveSettings);
resetDefaultsBtn.addEventListener("click", resetToDefaults);
exportDataBtn.addEventListener("click", exportData);
importDataBtn.addEventListener("click", () => {
	importFileInput.click();
});

importFileInput.addEventListener("change", (e) => {
	if (e.target.files.length > 0) {
		importData(e.target.files[0]);
		e.target.value = ""; // 同じファイルを再度選択できるようにリセット
	}
});

clearDataBtn.addEventListener("click", clearAllData);
changeShortcutLink.addEventListener("click", openShortcutSettings);
