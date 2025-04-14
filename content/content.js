const browserAPI = typeof browser !== "undefined" ? browser : chrome;
let popup_z_index = 3000;
let autosaveInterval = null;

browserAPI.runtime.onMessage.addListener((message) => {
	if (message.action === "createPopup") {
		createDraggablePopup();
	} else if (message.action === "openSavedPin") {
		openSavedPin(message.pinData);
	} else if (message.action === "showSaveConfirmation") {
		showSaveConfirmation();
	}
	return true;
});

function getPopupTemplate(content = "", id = null) {
	return `
    <div class="pincy-custom-popup" data-id="${id || ""}">
        <div class="pincy-popup-header">
            <span class="pincy-popup-close"><svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#FFFFFF"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg></span>
			<span class="pincy-popup-save"><svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#FFFFFF"><path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Z"/></svg></span>
        </div>
        <div
            class="pincy-popup-content"
            contenteditable="true"
            placeholder="ここにコンテンツを入力できます"
        >${content}</div>
    </div>
    `;
}

function createDraggablePopup(savedContent = "", pinId = null) {
	const tempContainer = document.createElement("div");
	tempContainer.innerHTML = getPopupTemplate(savedContent, pinId);
	const popup = tempContainer.querySelector(".pincy-custom-popup");

	// 設定を適用
	applySettings(popup, pinId);

	popup.style.top = "100px";
	popup.style.left = "100px";

	const closeBtn = popup.querySelector(".pincy-popup-close");
	if (closeBtn) {
		closeBtn.addEventListener("click", () => {
			// 自動保存のインターバルがある場合はクリア
			if (autosaveInterval) {
				clearInterval(autosaveInterval);
				autosaveInterval = null;
			}
			popup.remove();
		});
	}

	const saveBtn = popup.querySelector(".pincy-popup-save");
	if (saveBtn) {
		saveBtn.addEventListener("click", () => {
			saveCurrentPin(popup, pinId);
		});
	}

	const header = popup.querySelector(".pincy-popup-header");
	if (header) {
		implementDragging(popup, header, popup);
	}

	document.body.appendChild(popup);

	// 自動保存の設定
	setupAutosave(popup, pinId);
}

function applySettings(popup, pinId) {
	browserAPI.storage.local.get(["settings"], (result) => {
		const settings = result.settings || {};

		// 背景色の設定
		if (settings.defaultColor) {
			popup.style.backgroundColor = settings.defaultColor;
		}

		// サイズの設定
		if (settings.defaultWidth) {
			popup.style.width = `${settings.defaultWidth}px`;
		}
		if (settings.defaultHeight) {
			popup.style.minHeight = `${settings.defaultHeight}px`;
		}

		// フォントサイズの設定
		if (settings.fontSize) {
			const content = popup.querySelector(".pincy-popup-content");
			if (content) {
				switch (settings.fontSize) {
					case "small":
						content.style.fontSize = "12px";
						break;
					case "medium":
						content.style.fontSize = "15px";
						break;
					case "large":
						content.style.fontSize = "18px";
						break;
				}
			}
		}
	});
}

function setupAutosave(popup, pinId) {
	browserAPI.storage.local.get(["settings"], (result) => {
		const settings = result.settings || {};

		// 既存の自動保存があれば解除
		if (autosaveInterval) {
			clearInterval(autosaveInterval);
			autosaveInterval = null;
		}

		// 自動保存が有効な場合
		if (settings.autosave) {
			const interval = settings.saveInterval || 60; // デフォルトは60秒
			autosaveInterval = setInterval(() => {
				saveCurrentPin(popup, pinId);
			}, interval * 1000);
		}
	});
}

function saveCurrentPin(popup, pinId) {
	const content = popup.querySelector(".pincy-popup-content").innerHTML;
	browserAPI.runtime.sendMessage({
		action: "savePin",
		content: content,
		id: pinId || generateId(),
	});
}

function openSavedPin(pinData) {
	createDraggablePopup(pinData.content, pinData.id);
}

function generateId() {
	return (
		"pin_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now()
	);
}

function showSaveConfirmation() {
	const notification = document.createElement("div");
	notification.style.position = "fixed";
	notification.style.bottom = "20px";
	notification.style.right = "20px";
	notification.style.backgroundColor = "#4CAF50";
	notification.style.color = "white";
	notification.style.padding = "10px 20px";
	notification.style.borderRadius = "4px";
	notification.style.zIndex = "1000";
	notification.textContent = "メモを保存しました";

	document.body.appendChild(notification);

	setTimeout(() => {
		notification.style.opacity = "0";
		notification.style.transition = "opacity 0.5s";
		setTimeout(() => {
			notification.remove();
		}, 500);
	}, 2000);
}

function implementDragging(element, dragHandle, popup) {
	let offsetX = 0;
	let offsetY = 0;
	let isDragging = false;

	dragHandle.addEventListener("mousedown", (e) => {
		if (
			e.target.classList.contains("pincy-popup-close") ||
			e.target.classList.contains("pincy-popup-save")
		) {
			return;
		}

		isDragging = true;
		offsetX = e.clientX - element.getBoundingClientRect().left;
		offsetY = e.clientY - element.getBoundingClientRect().top;

		popup_z_index++;
		popup.style.zIndex = popup_z_index;

		element.style.opacity = "0.8";
		e.preventDefault();
	});

	document.addEventListener("mousemove", (e) => {
		if (!isDragging) return;

		// 新しい位置を計算
		const x = e.clientX - offsetX;
		const y = e.clientY - offsetY;

		// 画面外にはみ出さないように調整
		const maxX = window.innerWidth - element.offsetWidth;
		const maxY = window.innerHeight - element.offsetHeight;

		element.style.left = `${Math.max(0, Math.min(maxX, x))}px`;
		element.style.top = `${Math.max(0, Math.min(maxY, y))}px`;
	});

	document.addEventListener("mouseup", () => {
		if (isDragging) {
			isDragging = false;
			element.style.opacity = "1";
		}
	});

	document.addEventListener("mouseleave", () => {
		if (isDragging) {
			isDragging = false;
			element.style.opacity = "1";
		}
	});
}
