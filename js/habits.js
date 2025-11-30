window.Habits = (function () {
  function init() {
    document
      .getElementById("addHabitBtn")
      .addEventListener("click", () => openHabitModal());

    document
      .getElementById("habitForm")
      .addEventListener("submit", handleHabitFormSubmit);

    document
      .querySelectorAll("[data-close-modal='habitModal']")
      .forEach((btn) => btn.addEventListener("click", () => closeHabitModal()));

    renderHabits();
  }

  function openHabitModal(habitId) {
    const modal = document.getElementById("habitModal");
    const title = document.getElementById("habitModalTitle");
    const form = document.getElementById("habitForm");
    form.reset();
    document.getElementById("habitId").value = habitId || "";

    if (habitId) {
      title.textContent = "Edit Habit";
      const habit = window.App.state.habits.find((h) => h.id === habitId);
      if (habit) {
        document.getElementById("habitName").value = habit.name;
        document.getElementById("habitFrequency").value = habit.frequency;
        document.getElementById("habitColor").value = habit.color;
      }
    } else {
      title.textContent = "New Habit";
    }

    modal.classList.add("open");
  }

  function closeHabitModal() {
    document.getElementById("habitModal").classList.remove("open");
  }

  function handleHabitFormSubmit(e) {
    e.preventDefault();
    const id =
      document.getElementById("habitId").value || `habit_${Date.now()}`;
    const isNew = !window.App.state.habits.find((h) => h.id === id);

    const existing = window.App.state.habits.find((h) => h.id === id);
    const habit = {
      id,
      name: document.getElementById("habitName").value.trim(),
      frequency: document.getElementById("habitFrequency").value,
      color: document.getElementById("habitColor").value,
      completions: isNew ? {} : existing.completions || {},
    };

    if (isNew) {
      window.App.state.habits.push(habit);
    } else {
      const idx = window.App.state.habits.findIndex((h) => h.id === id);
      window.App.state.habits[idx] = habit;
    }

    Storage.saveState(window.App.state);
    closeHabitModal();
    renderHabits();
    window.App.refreshDashboard();
  }

  function toggleHabitDay(habitId, dateStr) {
    const habit = window.App.state.habits.find((h) => h.id === habitId);
    if (!habit) return;
    habit.completions = habit.completions || {};
    habit.completions[dateStr] = !habit.completions[dateStr];
    Storage.saveState(window.App.state);
    renderHabits();
    window.App.refreshDashboard();
  }

  function renderHabits() {
    const container = document.getElementById("habitsList");
    container.innerHTML = "";
    const today = new Date();

    const week = [];
    const dayIndex = today.getDay(); // 0-6
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - dayIndex + i);
      week.push({
        label: ["S", "M", "T", "W", "T", "F", "S"][i],
        dateStr: d.toISOString().slice(0, 10),
      });
    }

    window.App.state.habits.forEach((habit) => {
      const row = document.createElement("div");
      row.className = "habit-row";

      const header = document.createElement("div");
      header.className = "habit-header";
      const nameSpan = document.createElement("div");
      nameSpan.textContent = habit.name;
      const colorDot = document.createElement("span");
      colorDot.className = "color-dot";
      colorDot.style.background = habit.color;
      header.appendChild(nameSpan);
      header.appendChild(colorDot);

      const daysEl = document.createElement("div");
      daysEl.className = "habit-days";

      week.forEach((day) => {
        const dayEl = document.createElement("div");
        dayEl.className = "habit-day";
        dayEl.textContent = day.label;
        if (habit.completions && habit.completions[day.dateStr]) {
          dayEl.classList.add("completed");
        }
        dayEl.addEventListener("click", () =>
          toggleHabitDay(habit.id, day.dateStr)
        );
        daysEl.appendChild(dayEl);
      });

      row.appendChild(header);
      row.appendChild(daysEl);
      container.appendChild(row);
    });
  }

  function countCompletedToday() {
    const todayStr = new Date().toISOString().slice(0, 10);
    return window.App.state.habits.filter(
      (h) => h.completions && h.completions[todayStr]
    ).length;
  }

  return {
    init,
    renderHabits,
    countCompletedToday,
  };
})();
