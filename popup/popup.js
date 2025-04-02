const browserAPI = typeof browser !== "undefined" ? browser : chrome;
const createPinButton = document.getElementById("createPin");
const savedNotesContainer = document.getElementById("savedNotes");

function loadSavedNotes() {
	browserAPI.runtime.sendMessage({ action: "incrementBadge" });
	browserAPI.storage.local.get(["notes"], (result) => {
		const notes = Array.isArray(result.notes) ? result.notes.reverse() : [];

		if (notes.length === 0) {
			savedNotesContainer.innerHTML = `
                <div class="empty-state">
                    まだ保存された付箋はありません。<br>
                    「新しい付箋を作成」ボタンをクリックしてみましょう。
                </div>
            `;
			return;
		}

		savedNotesContainer.innerHTML = "";
		notes.forEach((note, index) => {
			const noteElement = document.createElement("div");
			noteElement.className = "note-item";
			noteElement.dataset.id = note.id;

			const displayText =
				note.content.length > 18
					? note.content.substring(0, 18) + "..."
					: note.content || "(空のメモ)";

			noteElement.innerHTML = `
                <p class="note-text">${displayText}</p>
                <p class="note-info">作成: ${new Date(
					note.createdAt
				).toLocaleString("ja-JP")} | ${note.content.length}文字</p>
				<button type="button" class="delete-pin-btn" data-note-id="${
					note.id
				}"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#FFFFFF"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/></svg></button>
            `;

			savedNotesContainer.appendChild(noteElement);

			noteElement.addEventListener("click", (e) => {
				if (e.target.classList.contains("delete-pin-btn")) {
					e.stopPropagation();
					return;
				}
				openSavedNote(note);
			});

			const deleteBtn = noteElement.querySelector(".delete-pin-btn");
			deleteBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				deleteNote(note.id);
				browserAPI.runtime.sendMessage({ action: "incrementBadge" });
			});
		});
	});
}

function deleteNote(noteId) {
	browserAPI.storage.local.get(["notes"], function (result) {
		const notes = result.notes || [];
		const filteredNotes = notes.filter((note) => note.id !== noteId);

		browserAPI.storage.local.set({ notes: filteredNotes }, function () {
			loadSavedNotes();

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

function openSavedNote(note) {
	browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		browserAPI.tabs.sendMessage(tabs[0].id, {
			action: "openSavedNote",
			noteData: note,
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

document.addEventListener("DOMContentLoaded", loadSavedNotes);
