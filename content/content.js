const browserAPI = typeof browser !== "undefined" ? browser : chrome;
let popup_z_index = 500;
let count = 500;

browserAPI.runtime.onMessage.addListener((message) => {
	if (message.action === "createPopup") {
		createDraggablePopup();
	}
	return true;
});

function getPopupTemplate() {
	return `
    <div class="pincy-custom-popup">
        <div class="pincy-popup-header">
            <span class="pincy-popup-close">×</span>
        </div>
        <div
            class="pincy-popup-content"
            contenteditable="true"
            placeholder="ここにコンテンツを入力できます"
        ></div>
	</div>
    `;
}

function createDraggablePopup() {
	const tempContainer = document.createElement("div");
	tempContainer.innerHTML = getPopupTemplate();
	const popup = tempContainer.querySelector(".pincy-custom-popup");

	popup.style.top = "100px";
	popup.style.left = "100px";

	const closeBtn = popup.querySelector(".pincy-popup-close");
	if (closeBtn) {
		closeBtn.addEventListener("click", () => {
			popup.remove();
		});
	}

	const header = popup.querySelector(".pincy-popup-header");
	if (header) {
		implementDragging(popup, header, popup);
	}

	document.body.appendChild(popup);
}

function implementDragging(element, dragHandle, popup) {
	let offsetX = 0;
	let offsetY = 0;
	let isDragging = false;

	dragHandle.addEventListener("mousedown", (e) => {
		if (e.target.classList.contains("pincy-popup-close")) {
			return;
		}

		isDragging = true;
		offsetX = e.clientX - element.getBoundingClientRect().left;
		offsetY = e.clientY - element.getBoundingClientRect().top;

		count++;
		popup.style.zIndex = count;

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
