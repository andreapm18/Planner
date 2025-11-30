window.App = {
  state: {
    tasks: [],
    events: [],
    notes: [],
    habits: [],
    categories: [],
    settings: {
      theme: "strawberry-milk",
      layout: "comfy",
      showQuotes: true,
    },
  },
  refreshDashboard: function () {
    renderDashboard();
  },
};

document.addEventListener("DOMContentLoaded", () => {
  // Load state
  const saved = Storage.loadState();
  if (saved) {
    window.App.state = saved;
  } else {
    seedInitialCategories();
  }

  // Init nav
  initNavigation();
  initGlobalSearch();

  // Init features
  Tasks.init();
  Calendar.init();
  Notes.init();
  Habits.init();

  // Theme
  Theme.applySavedTheme();

  // Category list in sidebar
  renderCategorySidebar();

  // Dashboard
  renderDashboard();

  // Theme toggle
  document
    .getElementById("themeToggleBtn")
    .addEventListener("click", Theme.toggleTheme);

  // Category modal
  initCategoryModal();

  // Pomodoro
  initPomodoro();
});

/* Navigation */
function initNavigation() {
  const navButtons = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".page-section");

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-page");
      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      sections.forEach((sec) => {
        sec.classList.toggle("active", sec.id === page);
      });
    });
  });
}

/* Global search: simple – just toggles to Tasks page for now */
function initGlobalSearch() {
  const input = document.getElementById("globalSearch");
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    document.body.dataset.searching = q.length > 0 ? "1" : "";
    if (q.length > 0) {
      switchToPage("tasks");
    }
  });
}

function switchToPage(pageId) {
  document.querySelectorAll(".page-section").forEach((sec) => {
    sec.classList.toggle("active", sec.id === pageId);
  });
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-page") === pageId);
  });
}

/* Seed initial categories */
function seedInitialCategories() {
  window.App.state.categories = [
    { id: "cat_school", name: "School", color: "var(--blue-accent)" },
    { id: "cat_work", name: "Work", color: "var(--purple-accent)" },
    { id: "cat_personal", name: "Personal", color: "var(--mint-accent)" },
  ];
  Storage.saveState(window.App.state);
}

/* Category sidebar */
function renderCategorySidebar() {
  const list = document.getElementById("categoryList");
  list.innerHTML = "";
  window.App.state.categories.forEach((cat) => {
    const li = document.createElement("li");
    li.className = "category-item";
    li.innerHTML = `
      <span><span class="color-dot" style="background:${cat.color}"></span>${
      cat.name
    }</span>
      <button class="btn-ghost" data-edit-cat="${cat.id}">⋯</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll("[data-edit-cat]").forEach((btn) => {
    btn.addEventListener("click", () => openCategoryModal(btn.dataset.editCat));
  });

  // Refresh category selects
  Tasks.refreshTaskCategoryOptions();
  Calendar.refreshEventCategoryOptions();
  Notes.refreshNoteCategoryOptions();
}

/* Category Modal */
function initCategoryModal() {
  document
    .getElementById("addCategoryBtn")
    .addEventListener("click", () => openCategoryModal());

  document
    .getElementById("categoryForm")
    .addEventListener("submit", handleCategoryFormSubmit);

  document
    .querySelectorAll("[data-close-modal='categoryModal']")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        document.getElementById("categoryModal").classList.remove("open")
      )
    );
}

function openCategoryModal(categoryId) {
  const modal = document.getElementById("categoryModal");
  const title = document.getElementById("categoryModalTitle");
  const form = document.getElementById("categoryForm");
  form.reset();
  document.getElementById("categoryId").value = categoryId || "";

  if (categoryId) {
    title.textContent = "Edit Category";
    const cat = window.App.state.categories.find((c) => c.id === categoryId);
    if (cat) {
      document.getElementById("categoryName").value = cat.name;
      document.getElementById("categoryColor").value = cat.color;
    }
  } else {
    title.textContent = "New Category";
  }

  modal.classList.add("open");
}

function handleCategoryFormSubmit(e) {
  e.preventDefault();
  const id =
    document.getElementById("categoryId").value || `cat_${Date.now()}`;
  const isNew = !window.App.state.categories.find((c) => c.id === id);
  const category = {
    id,
    name: document.getElementById("categoryName").value.trim(),
    color: document.getElementById("categoryColor").value,
  };

  if (isNew) {
    window.App.state.categories.push(category);
  } else {
    const idx = window.App.state.categories.findIndex((c) => c.id === id);
    window.App.state.categories[idx] = category;
  }

  Storage.saveState(window.App.state);
  document.getElementById("categoryModal").classList.remove("open");
  renderCategorySidebar();
}

/* Dashboard */
function renderDashboard() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  document.getElementById("todayDateText").textContent = todayStr;

  const todayTasks = window.App.state.tasks.filter(
    (t) => t.dueDate === todayStr
  );
  document.getElementById("todayTasksCount").textContent = todayTasks.length;

  // Quick add task
  document
    .getElementById("quickTaskAddBtn")
    .addEventListener("click", handleQuickTaskAdd);
  document
    .getElementById("quickTaskInput")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleQuickTaskAdd();
      }
    });

  // Weekly stats: tasks updated in last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  const weekTasks = window.App.state.tasks.filter((t) => {
    const updated = new Date(t.updatedAt || t.createdAt || todayStr);
    return updated >= weekAgo;
  });

  const total = weekTasks.length;
  const done = weekTasks.filter((t) => t.status === "done").length;
  document.getElementById("weekTotalCount").textContent = total;
  document.getElementById("weekDoneCount").textContent = done;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById("weekProgressBar").style.width = pct + "%";

  // Upcoming events (next 3)
  const events = window.App.state.events
    .filter((ev) => ev.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  const list = document.getElementById("upcomingEventsList");
  list.innerHTML = "";
  events.forEach((ev) => {
    const li = document.createElement("li");
    li.textContent = `${ev.date} – ${ev.title}`;
    list.appendChild(li);
  });

  // Habits completed today
  const habitsDone = Habits.countCompletedToday();
  document.getElementById("habitsCompletedToday").textContent = habitsDone;
}

function handleQuickTaskAdd() {
  const input = document.getElementById("quickTaskInput");
  const text = input.value.trim();
  if (!text) return;
  const todayStr = new Date().toISOString().slice(0, 10);
  const task = {
    id: `task_${Date.now()}`,
    title: text,
    description: "",
    status: "not_started",
    dueDate: todayStr,
    categoryId: null,
    priority: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  window.App.state.tasks.push(task);
  Storage.saveState(window.App.state);
  input.value = "";
  Tasks.renderTasks();
  renderDashboard();
  Calendar.renderTodayPanel();
}

/* Pomodoro */
let pomodoroSeconds = 25 * 60;
let pomodoroTimer = null;

function initPomodoro() {
  updatePomodoroDisplay();

  document
    .getElementById("pomodoroStartBtn")
    .addEventListener("click", () => {
      if (pomodoroTimer) return;
      pomodoroTimer = setInterval(() => {
        pomodoroSeconds = Math.max(0, pomodoroSeconds - 1);
        updatePomodoroDisplay();
        if (pomodoroSeconds === 0) {
          clearInterval(pomodoroTimer);
          pomodoroTimer = null;
        }
      }, 1000);
    });

  document.getElementById("pomodoroPauseBtn").addEventListener("click", () => {
    if (pomodoroTimer) {
      clearInterval(pomodoroTimer);
      pomodoroTimer = null;
    }
  });

  document.getElementById("pomodoroResetBtn").addEventListener("click", () => {
    if (pomodoroTimer) {
      clearInterval(pomodoroTimer);
      pomodoroTimer = null;
    }
    pomodoroSeconds = 25 * 60;
    updatePomodoroDisplay();
  });
}

function updatePomodoroDisplay() {
  const mins = String(Math.floor(pomodoroSeconds / 60)).padStart(2, "0");
  const secs = String(pomodoroSeconds % 60).padStart(2, "0");
  document.getElementById("pomodoroDisplay").textContent = `${mins}:${secs}`;
}
