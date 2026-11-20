/* Loaded only inside the iOS bundle. GitHub Pages does not reference this file. */
(() => {
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  document.documentElement.dataset.native = 'ios';
  const css = document.createElement('style');
  css.textContent = 'html,body{overscroll-behavior:none}textarea,input{-webkit-user-select:text}';
  document.head.appendChild(css);
  const plugins = cap.Plugins || {};
  const quiet = (p) => (p && p.catch ? p.catch(() => {}) : p);
  if (plugins.StatusBar) {
    quiet(plugins.StatusBar.setOverlaysWebView({ overlay: true }));
    quiet(plugins.StatusBar.setStyle({ style: 'LIGHT' }));
  }
  if (plugins.Keyboard) quiet(plugins.Keyboard.setResizeMode({ mode: 'body' }));
  if (plugins.SplashScreen) quiet(plugins.SplashScreen.hide());
  if (plugins.Haptics) {
    navigator.vibrate = (pattern) => {
      const n = Array.isArray(pattern) ? pattern[0] : pattern;
      const style = n > 40 ? 'HEAVY' : n > 20 ? 'MEDIUM' : 'LIGHT';
      quiet(plugins.Haptics.impact({ style }));
      return true;
    };
  }
})();
