const browserAPI = typeof browser !== "undefined" ? browser : chrome;

let popupInstance = null;

browserAPI.runtime.onMessage.addListener((message) => {
	if (message.action === "togglePopup") {
		togglePopup();
	}
	return true;
});

function togglePopup() {
	if (popupInstance) {
		popupInstance.remove();
		popupInstance = null;
	} else {
		createDraggablePopup();
	}
}

function getPopupTemplate() {
	return `
      <div class="custom-popup">
    <div class="popup-header">
        <span class="popup-close">×</span>
    </div>
    <div
        class="popup-content"
        contenteditable="true"
        placeholder="ここにコンテンツを入力できます"
    ></div>
</div>
    `;
}

function createDraggablePopup() {
	const tempContainer = document.createElement("div");
	tempContainer.innerHTML = getPopupTemplate();
	const popup = tempContainer.querySelector(".custom-popup");

	popup.style.top = "100px";
	popup.style.left = "100px";

	const closeBtn = popup.querySelector(".popup-close");
	if (closeBtn) {
		closeBtn.addEventListener("click", () => {
			popup.remove();
			popupInstance = null;
		});
	}

	const header = popup.querySelector(".popup-header");
	if (header) {
		implementDragging(popup, header);
	}

	document.body.appendChild(popup);
	popupInstance = popup;
}

function implementDragging(element, dragHandle) {
	let offsetX = 0;
	let offsetY = 0;
	let isDragging = false;

	dragHandle.addEventListener("mousedown", (e) => {
		if (e.target.classList.contains("popup-close")) {
			return;
		}

		isDragging = true;
		offsetX = e.clientX - element.getBoundingClientRect().left;
		offsetY = e.clientY - element.getBoundingClientRect().top;

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
