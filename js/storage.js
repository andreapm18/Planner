window.Storage = (function () {
  const KEY = "pinkPlannerState";

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load state", e);
      return null;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state", e);
    }
  }

  return {
    loadState,
    saveState,
  };
})();
