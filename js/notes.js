window.Notes = (function () {
  function init() {
    document
      .getElementById("addNoteBtn")
      .addEventListener("click", () => openNoteModal());

    document
      .getElementById("noteForm")
      .addEventListener("submit", handleNoteFormSubmit);

    document
      .querySelectorAll("[data-close-modal='noteModal']")
      .forEach((btn) => btn.addEventListener("click", () => closeNoteModal()));

    refreshNoteCategoryOptions();
    renderNotes();
  }

  function refreshNoteCategoryOptions() {
    const select = document.getElementById("noteCategory");
    select.innerHTML = "";
    window.App.state.categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  }

  function openNoteModal(noteId) {
    const modal = document.getElementById("noteModal");
    const titleEl = document.getElementById("noteModalTitle");
    const form = document.getElementById("noteForm");
    form.reset();
    document.getElementById("noteId").value = noteId || "";

    if (noteId) {
      titleEl.textContent = "Edit Note";
      const note = window.App.state.notes.find((n) => n.id === noteId);
      if (note) {
        document.getElementById("noteTitle").value = note.title;
        document.getElementById("noteContent").value = note.content || "";
        document.getElementById("noteCategory").value = note.categoryId || "";
        document.getElementById("notePinned").checked = !!note.pinned;
      }
    } else {
      titleEl.textContent = "New Note";
    }

    modal.classList.add("open");
  }

  function closeNoteModal() {
    document.getElementById("noteModal").classList.remove("open");
  }

  function handleNoteFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("noteId").value || `note_${Date.now()}`;
    const isNew = !window.App.state.notes.find((n) => n.id === id);
    const note = {
      id,
      title: document.getElementById("noteTitle").value.trim(),
      content: document.getElementById("noteContent").value.trim(),
      categoryId: document.getElementById("noteCategory").value || null,
      pinned: document.getElementById("notePinned").checked,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isNew) {
      window.App.state.notes.push(note);
    } else {
      const idx = window.App.state.notes.findIndex((n) => n.id === id);
      window.App.state.notes[idx] = note;
    }

    Storage.saveState(window.App.state);
    closeNoteModal();
    renderNotes();
  }

  function deleteNote(noteId) {
    window.App.state.notes = window.App.state.notes.filter((n) => n.id !== noteId);
    Storage.saveState(window.App.state);
    renderNotes();
  }

  function renderNotes() {
    const container = document.getElementById("notesList");
    container.innerHTML = "";
    const notes = [...window.App.state.notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });

    notes.forEach((note) => {
      const cat = window.App.state.categories.find(
        (c) => c.id === note.categoryId
      );
      const card = document.createElement("div");
      card.className = "note-card";
      card.style.borderLeftColor = cat ? cat.color : "var(--pink-main)";

      const pinned = note.pinned ? "★" : "";
      card.innerHTML = `
        <h3>${pinned ? "★ " : ""}${note.title}</h3>
        ${
          cat
            ? `<div class="muted"><span class="color-dot" style="background:${cat.color}"></span>${cat.name}</div>`
            : ""
        }
        <div class="note-card-content">${note.content
          .replace(/\n/g, "<br>")
          .slice(0, 300)}</div>
      `;

      card.addEventListener("click", () => openNoteModal(note.id));

      const footer = document.createElement("div");
      footer.style.display = "flex";
      footer.style.justifyContent = "space-between";
      footer.style.marginTop = "0.4rem";
      footer.style.fontSize = "0.78rem";

      const pinBtn = document.createElement("button");
      pinBtn.className = "btn-ghost";
      pinBtn.textContent = note.pinned ? "Unpin" : "Pin";
      pinBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        note.pinned = !note.pinned;
        note.updatedAt = new Date().toISOString();
        Storage.saveState(window.App.state);
        renderNotes();
      });

      const delBtn = document.createElement("button");
      delBtn.className = "btn-ghost";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        deleteNote(note.id);
      });

      footer.appendChild(pinBtn);
      footer.appendChild(delBtn);
      card.appendChild(footer);

      container.appendChild(card);
    });
  }

  return {
    init,
    renderNotes,
    refreshNoteCategoryOptions,
    openNoteModal,
  };
})();
