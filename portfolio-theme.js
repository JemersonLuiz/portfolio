(() => {
  const key = "portfolio.theme";
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  let button;

  function apply(theme) {
    const light = theme === "light";
    root.dataset.theme = light ? "light" : "dark";
    themeColor.content = light ? "#fafbf7" : "#000000";
    if (button) {
      const next = light ? "escuro" : "claro";
      button.title = "Ativar tema " + next;
      button.setAttribute("aria-label", button.title);
      button.querySelector("span").textContent = "Tema " + next;
    }
  }

  function restore() {
    try {
      apply(localStorage.getItem(key));
    } catch {
      apply(root.dataset.theme);
    }
  }

  restore();
  document.addEventListener("DOMContentLoaded", () => {
    button = document.querySelector(".theme-button");
    apply(root.dataset.theme);
    button.hidden = false;
    button.addEventListener("click", () => {
      apply(root.dataset.theme === "dark" ? "light" : "dark");
      try {
        localStorage.setItem(key, root.dataset.theme);
      } catch {
        // Keep the selection for this page if the browser disallows storage.
      }
    });
  });
  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) restore();
  });
  window.addEventListener("pageshow", event => {
    if (event.persisted) restore();
  });
})();
