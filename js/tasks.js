window.Tasks = (function () {
  const STATUS_LABELS = {
    not_started: "Not started",
    in_progress: "In progress",
    almost_done: "Almost done",
    done: "Done",
  };

  function init() {
    document
      .getElementById("addTaskBtn")
      .addEventListener("click", () => openTaskModal());

    document
      .getElementById("taskForm")
      .addEventListener("submit", handleTaskFormSubmit);

    document.getElementById("toggleTaskViewBtn").addEventListener("click", () => {
      const board = document.getElementById("tasksBoardView");
      const list = document.getElementById("tasksListView");
      const btn = document.getElementById("toggleTaskViewBtn");
      const boardActive = !board.classList.contains("hidden");
      if (boardActive) {
        board.classList.add("hidden");
        list.classList.remove("hidden");
        btn.textContent = "Board View";
      } else {
        board.classList.remove("hidden");
        list.classList.add("hidden");
        btn.textContent = "List View";
      }
    });

    // Close buttons
    document.querySelectorAll("[data-close-modal='taskModal']").forEach((btn) => {
      btn.addEventListener("click", () => closeTaskModal());
    });

    refreshTaskCategoryOptions();
    renderTasks();
  }

  function refreshTaskCategoryOptions() {
    const select = document.getElementById("taskCategory");
    select.innerHTML = "";
    window.App.state.categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  }

  function openTaskModal(taskId) {
    const modal = document.getElementById("taskModal");
    const title = document.getElementById("taskModalTitle");
    const form = document.getElementById("taskForm");

    form.reset();
    document.getElementById("taskId").value = taskId || "";

    if (taskId) {
      title.textContent = "Edit Task";
      const task = window.App.state.tasks.find((t) => t.id === taskId);
      if (task) {
        document.getElementById("taskTitle").value = task.title;
        document.getElementById("taskDescription").value = task.description || "";
        document.getElementById("taskStatus").value = task.status;
        document.getElementById("taskDueDate").value = task.dueDate || "";
        document.getElementById("taskCategory").value = task.categoryId || "";
        document.getElementById("taskPriority").value = task.priority || "medium";
      }
    } else {
      title.textContent = "New Task";
    }

    modal.classList.add("open");
  }

  function closeTaskModal() {
    document.getElementById("taskModal").classList.remove("open");
  }

  function handleTaskFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("taskId").value || `task_${Date.now()}`;
    const isNew = !window.App.state.tasks.find((t) => t.id === id);

    const task = {
      id,
      title: document.getElementById("taskTitle").value.trim(),
      description: document.getElementById("taskDescription").value.trim(),
      status: document.getElementById("taskStatus").value,
      dueDate: document.getElementById("taskDueDate").value || null,
      categoryId: document.getElementById("taskCategory").value || null,
      priority: document.getElementById("taskPriority").value || "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isNew) {
      window.App.state.tasks.push(task);
    } else {
      const index = window.App.state.tasks.findIndex((t) => t.id === id);
      window.App.state.tasks[index] = task;
    }

    Storage.saveState(window.App.state);
    closeTaskModal();
    renderTasks();
    window.App.refreshDashboard();
    window.Calendar.renderTodayPanel();
  }

  function deleteTask(taskId) {
    window.App.state.tasks = window.App.state.tasks.filter((t) => t.id !== taskId);
    Storage.saveState(window.App.state);
    renderTasks();
    window.App.refreshDashboard();
    window.Calendar.renderTodayPanel();
  }

  function changeStatus(taskId, newStatus) {
    const task = window.App.state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();
    Storage.saveState(window.App.state);
    renderTasks();
    window.App.refreshDashboard();
  }

  function renderTasks() {
    renderBoard();
    renderList();
  }

  function renderBoard() {
    const columns = ["not_started", "in_progress", "almost_done", "done"];
    columns.forEach((status) => {
      const container = document.getElementById(`column-${status}`);
      container.innerHTML = "";
      const tasks = window.App.state.tasks.filter((t) => t.status === status);
      document.getElementById(`count-${status}`).textContent = tasks.length;
      tasks.forEach((task) => {
        const card = document.createElement("div");
        card.className = "task-card";

        const cat = window.App.state.categories.find(
          (c) => c.id === task.categoryId
        );

        card.innerHTML = `
          <div class="task-card-title">${task.title}</div>
          <div class="task-card-meta">
            ${
              task.dueDate
                ? `<span class="muted">Due ${task.dueDate}</span>`
                : ""
            }
            ${
              cat
                ? `<span class="chip"><span class="color-dot" style="background:${cat.color}"></span>${cat.name}</span>`
                : ""
            }
            <span class="priority-badge priority-${task.priority}">
              ${task.priority[0].toUpperCase() + task.priority.slice(1)}
            </span>
          </div>
          <div class="task-card-meta">
            <span class="status-pill status-${task.status}">${
          STATUS_LABELS[task.status]
        }</span>
          </div>
        `;

        card.addEventListener("click", () => openTaskModal(task.id));

        const footer = document.createElement("div");
        footer.style.display = "flex";
        footer.style.justifyContent = "space-between";
        footer.style.marginTop = "0.25rem";
        footer.style.fontSize = "0.72rem";

        const statusSelect = document.createElement("select");
        Object.entries(STATUS_LABELS).forEach(([value, label]) => {
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = label;
          if (value === task.status) opt.selected = true;
          statusSelect.appendChild(opt);
        });
        statusSelect.addEventListener("change", (e) =>
          changeStatus(task.id, e.target.value)
        );

        const delBtn = document.createElement("button");
        delBtn.className = "btn-ghost";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          deleteTask(task.id);
        });

        footer.appendChild(statusSelect);
        footer.appendChild(delBtn);
        card.appendChild(footer);

        container.appendChild(card);
      });
    });
  }

  function renderList() {
    const body = document.getElementById("tasksListBody");
    body.innerHTML = "";
    window.App.state.tasks.forEach((task) => {
      const row = document.createElement("tr");
      const cat = window.App.state.categories.find(
        (c) => c.id === task.categoryId
      );
      row.innerHTML = `
        <td>${task.title}</td>
        <td><span class="status-pill status-${task.status}">${
        STATUS_LABELS[task.status]
      }</span></td>
        <td>${task.dueDate || ""}</td>
        <td>${
          cat
            ? `<span class="color-dot" style="background:${cat.color}"></span>${cat.name}`
            : ""
        }</td>
        <td><span class="priority-badge priority-${task.priority}">
          ${task.priority[0].toUpperCase() + task.priority.slice(1)}
        </span></td>
      `;
      row.addEventListener("click", () => openTaskModal(task.id));
      body.appendChild(row);
    });
  }

  return {
    init,
    renderTasks,
    refreshTaskCategoryOptions,
    openTaskModal,
  };
})();
