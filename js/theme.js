window.Theme = (function () {
  const THEMES = {
    "strawberry-milk": {
      "--bg-main": "#fff6fb",
      "--pink-main": "#ff72b6",
    },
    "blueberry-sky": {
      "--bg-main": "#f3f5ff",
      "--pink-main": "#5f8bff",
    },
  };

  function applyThemeName(name) {
    const vars = THEMES[name] || THEMES["strawberry-milk"];
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) =>
      root.style.setProperty(key, value)
    );
    if (window.App && window.App.state && window.App.state.settings) {
      window.App.state.settings.theme = name;
      Storage.saveState(window.App.state);
    }
  }

  function toggleTheme() {
    const current = window.App.state.settings.theme || "strawberry-milk";
    const next =
      current === "strawberry-milk" ? "blueberry-sky" : "strawberry-milk";
    applyThemeName(next);
  }

  function applySavedTheme() {
    const name = window.App.state.settings.theme || "strawberry-milk";
    applyThemeName(name);
  }

  return {
    toggleTheme,
    applySavedTheme,
  };
})();
