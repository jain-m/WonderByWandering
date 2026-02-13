/**
 * Canvas Loader — placeholder script for canvas.html
 * Reads sessionId from URL and loads session data from chrome.storage.local.
 * This file will be replaced by the Vite-built React app (dist/canvas.js) in E3-1.
 */
(function () {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId');

  const placeholder = document.querySelector('.canvas-placeholder p');
  const sourceDisplay = document.getElementById('source-display');

  if (!sessionId) {
    placeholder.textContent = 'No session ID found in URL.';
    return;
  }

  placeholder.textContent = `Session: ${sessionId}`;

  chrome.storage.local.get([`session_${sessionId}`], (result) => {
    const session = result[`session_${sessionId}`];
    if (!session) {
      sourceDisplay.textContent = 'Session data not found.';
      return;
    }

    const excerpt = session.sourceText.length > 300
      ? session.sourceText.substring(0, 300) + '...'
      : session.sourceText;

    sourceDisplay.textContent = excerpt;
  });
})();
