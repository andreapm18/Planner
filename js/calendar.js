window.Calendar = (function () {
  let currentMonth;
  let currentYear;
  let activeCategoryIds = new Set(); // empty => all

  function init() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();

    document
      .getElementById("prevMonthBtn")
      .addEventListener("click", () => changeMonth(-1));
    document
      .getElementById("nextMonthBtn")
      .addEventListener("click", () => changeMonth(1));
    document
      .getElementById("addEventBtn")
      .addEventListener("click", () => openEventModal());

    document
      .getElementById("eventForm")
      .addEventListener("submit", handleEventFormSubmit);

    document
      .querySelectorAll("[data-close-modal='eventModal']")
      .forEach((btn) => btn.addEventListener("click", () => closeEventModal()));

    refreshEventCategoryOptions();
    renderCalendar();
    renderTodayPanel();
    renderCategoryFilter();
  }

  function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear -= 1;
    } else if (currentMonth > 11) {
      currentMonth = 0;
      currentYear += 1;
    }
    renderCalendar();
  }

  function refreshEventCategoryOptions() {
    const select = document.getElementById("eventCategory");
    select.innerHTML = "";
    window.App.state.categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  }

  function openEventModal(dateStr) {
    const modal = document.getElementById("eventModal");
    const title = document.getElementById("eventModalTitle");
    const form = document.getElementById("eventForm");
    form.reset();
    document.getElementById("eventId").value = "";
    title.textContent = "New Event";

    if (dateStr) {
      document.getElementById("eventDate").value = dateStr;
    }

    modal.classList.add("open");
  }

  function closeEventModal() {
    document.getElementById("eventModal").classList.remove("open");
  }

  function handleEventFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("eventId").value || `event_${Date.now()}`;
    const isNew = !window.App.state.events.find((ev) => ev.id === id);
    const event = {
      id,
      title: document.getElementById("eventTitle").value.trim(),
      date: document.getElementById("eventDate").value,
      startTime: document.getElementById("eventStartTime").value || null,
      endTime: document.getElementById("eventEndTime").value || null,
      categoryId: document.getElementById("eventCategory").value || null,
    };

    if (isNew) {
      window.App.state.events.push(event);
    } else {
      const idx = window.App.state.events.findIndex((ev) => ev.id === id);
      window.App.state.events[idx] = event;
    }

    Storage.saveState(window.App.state);
    closeEventModal();
    renderCalendar();
    renderTodayPanel();
    window.App.refreshDashboard();
  }

  function renderCalendar() {
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];

    document.getElementById(
      "calendarMonthLabel"
    ).textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDay = firstDay.getDay(); // 0-6
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const container = document.getElementById("calendarDays");
    container.innerHTML = "";

    const totalCells = 42; // 6 weeks
    for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";

      let dayNumber;
      let cellMonth = currentMonth;
      let cellYear = currentYear;
      let isOtherMonth = false;

      if (cellIndex < startingDay) {
        // prev month
        dayNumber = prevMonthDays - (startingDay - 1 - cellIndex);
        cellMonth = currentMonth - 1;
        if (cellMonth < 0) {
          cellMonth = 11;
          cellYear = currentYear - 1;
        }
        isOtherMonth = true;
      } else if (cellIndex >= startingDay + daysInMonth) {
        // next month
        dayNumber = cellIndex - (startingDay + daysInMonth) + 1;
        cellMonth = currentMonth + 1;
        if (cellMonth > 11) {
          cellMonth = 0;
          cellYear = currentYear + 1;
        }
        isOtherMonth = true;
      } else {
        // current month
        dayNumber = cellIndex - startingDay + 1;
      }

      if (isOtherMonth) {
        dayEl.classList.add("other-month");
      }

      const dateObj = new Date(cellYear, cellMonth, dayNumber);
      const dateStr = dateObj.toISOString().slice(0, 10);

      const header = document.createElement("div");
      header.className = "calendar-day-header";
      const numSpan = document.createElement("div");
      numSpan.className = "calendar-day-number";
      numSpan.textContent = dayNumber;
      header.appendChild(numSpan);
      dayEl.appendChild(header);

      const eventsContainer = document.createElement("div");
      eventsContainer.className = "calendar-day-events";

      const events = window.App.state.events.filter((ev) => ev.date === dateStr);
      events.forEach((ev) => {
        if (activeCategoryIds.size > 0 && ev.categoryId) {
          if (!activeCategoryIds.has(ev.categoryId)) return;
        }
        const pill = document.createElement("div");
        pill.className = "calendar-event-pill";
        const cat = window.App.state.categories.find(
          (c) => c.id === ev.categoryId
        );
        pill.style.background = cat ? cat.color : "var(--purple-accent)";
        pill.textContent = ev.title;
        eventsContainer.appendChild(pill);
      });

      dayEl.appendChild(eventsContainer);

      dayEl.addEventListener("click", () => openEventModal(dateStr));

      container.appendChild(dayEl);
    }

    renderTodayPanel();
    renderCategoryFilter();
  }

  function renderTodayPanel() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const label = document.getElementById("calendarTodayDate");
    label.textContent = dateStr;

    const tasksUl = document.getElementById("calendarTodayTasks");
    tasksUl.innerHTML = "";
    const tasks = window.App.state.tasks.filter((t) => t.dueDate === dateStr);
    tasks.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t.title;
      tasksUl.appendChild(li);
    });

    const eventsUl = document.getElementById("calendarTodayEvents");
    eventsUl.innerHTML = "";
    const events = window.App.state.events.filter((ev) => ev.date === dateStr);
    events.forEach((ev) => {
      const li = document.createElement("li");
      li.textContent = ev.title;
      eventsUl.appendChild(li);
    });
  }

  function renderCategoryFilter() {
    const container = document.getElementById("calendarCategoryFilter");
    container.innerHTML = "";
    window.App.state.categories.forEach((cat) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      if (activeCategoryIds.size === 0 || activeCategoryIds.has(cat.id)) {
        chip.classList.add("active");
      }
      chip.innerHTML = `<span class="color-dot" style="background:${cat.color}"></span>${cat.name}`;
      chip.addEventListener("click", () => toggleCategoryFilter(cat.id));
      container.appendChild(chip);
    });
  }

  function toggleCategoryFilter(catId) {
    if (activeCategoryIds.has(catId)) {
      activeCategoryIds.delete(catId);
    } else {
      activeCategoryIds.add(catId);
    }
    renderCalendar();
  }

  return {
    init,
    renderCalendar,
    renderTodayPanel,
    refreshEventCategoryOptions,
  };
})();
