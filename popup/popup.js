const browserAPI = typeof browser !== "undefined" ? browser : chrome;
const createPinButton = document.getElementById("createPin");
const savedNotesContainer = document.getElementById("savedNotes");

function loadSavedNotes() {
	browserAPI.storage.local.get(["notes"], function (result) {
		const notes = result.notes.reverse() || [];

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
            `;

			// クリックしたらそのメモを開く
			noteElement.addEventListener("click", () => {
				openSavedNote(note);
			});

			savedNotesContainer.appendChild(noteElement);
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
