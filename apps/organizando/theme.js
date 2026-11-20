(() => {
  const key = 'organizando.theme';
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  let toggle;

  function apply(value) {
    const dark = value !== 'light';
    root.dataset.theme = dark ? 'dark' : 'light';
    themeColor.content = dark ? '#090b0a' : '#f4f5ef';
    toggle?.setAttribute('aria-checked', String(dark));
  }

  try {
    apply(localStorage.getItem(key));
  } catch {
    apply('dark');
  }

  document.addEventListener('DOMContentLoaded', () => {
    toggle = document.getElementById('night-mode');
    apply(root.dataset.theme);
    toggle.addEventListener('click', () => {
      apply(root.dataset.theme === 'dark' ? 'light' : 'dark');
      try {
        localStorage.setItem(key, root.dataset.theme);
      } catch {
        // The current page still follows the selected theme when storage is unavailable.
      }
    });
  });

  window.addEventListener('storage', event => {
    if (event.storageArea === localStorage && (event.key === key || event.key === null)) {
      apply(event.newValue);
    }
  });
})();
