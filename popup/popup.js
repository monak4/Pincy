const browserAPI = typeof browser !== "undefined" ? browser : chrome;
const createPinButton = document.getElementById("createPin");
const savedPinsContainer = document.getElementById("savedPins");

function loadSavedPins() {
	browserAPI.runtime.sendMessage({ action: "incrementBadge" });
	browserAPI.storage.local.get(["pins"], (result) => {
		const pins = Array.isArray(result.pins) ? result.pins.reverse() : [];

		if (pins.length === 0) {
			savedPinsContainer.innerHTML = `
                <div class="empty-state">
                    まだ保存されたピンはありません。<br>
                    「新しいピンを作成」ボタンをクリックしてみましょう。
                </div>
            `;
			return;
		}

		savedPinsContainer.innerHTML = "";
		pins.forEach((pin, index) => {
			const pinElement = document.createElement("div");
			pinElement.className = "pin-item";
			pinElement.dataset.id = pin.id;

			const displayText =
				pin.content.length > 18
					? pin.content.substring(0, 18) + "..."
					: pin.content || "(空のメモ)";

			pinElement.innerHTML = `
                <p class="pin-text">${displayText}</p>
                <p class="pin-info">作成: ${new Date(
					pin.createdAt
				).toLocaleString("ja-JP")} | ${pin.content.length}文字</p>
				<button type="button" class="delete-pin-btn" data-pin-id="${
					pin.id
				}"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#FFFFFF"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/></svg></button>
            `;

			savedPinsContainer.appendChild(pinElement);

			pinElement.addEventListener("click", (e) => {
				if (e.target.classList.contains("delete-pin-btn")) {
					e.stopPropagation();
					return;
				}
				openSavedPin(pin);
			});

			const deleteBtn = pinElement.querySelector(".delete-pin-btn");
			deleteBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				deletePin(pin.id);
				browserAPI.runtime.sendMessage({ action: "incrementBadge" });
			});
		});
	});
}

function deletePin(pinId) {
	browserAPI.storage.local.get(["pins"], function (result) {
		const pins = result.pins || [];
		const filteredPins = pins.filter((pin) => pin.id !== pinId);

		browserAPI.storage.local.set({ pins: filteredPins }, function () {
			loadSavedPins();

			const notification = document.createElement("div");
			notification.textContent = "メモを削除しました";
			notification.style.backgroundColor = "#ff6b6b";
			notification.style.color = "white";
			notification.style.padding = "5px 10px";
			notification.style.borderRadius = "4px";
			notification.style.position = "fixed";
			notification.style.bottom = "10px";
			notification.style.left = "50%";
			notification.style.transform = "translateX(-50%)";
			notification.style.zIndex = "1000";

			document.body.appendChild(notification);

			setTimeout(() => {
				notification.style.opacity = "0";
				notification.style.transition = "opacity 0.5s";
				setTimeout(() => {
					notification.remove();
				}, 500);
			}, 2000);
		});
	});
}

function openSavedPin(pin) {
	browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		browserAPI.tabs.sendMessage(tabs[0].id, {
			action: "openSavedPin",
			pinData: pin,
		});
		window.close();
	});
}

createPinButton.addEventListener("click", () => {
	browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		browserAPI.tabs.sendMessage(tabs[0].id, { action: "createPopup" });
		window.close();
	});
});

document.addEventListener("DOMContentLoaded", loadSavedPins);
