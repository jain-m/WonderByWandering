// Save key to chrome.storage
document.getElementById('save').addEventListener('click', () => {
  const key = document.getElementById('apiKey').value;
  chrome.storage.local.set({ MY_API_KEY: key }, () => {
    alert('Key saved locally!');
  });
});