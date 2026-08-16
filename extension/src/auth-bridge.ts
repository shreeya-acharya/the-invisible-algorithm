const token = localStorage.getItem('invisible_algo_token');

if (token) {
  chrome.storage.local.set({ invisible_algo_token: token });
  console.log('[Invisible Algorithm] Auth token synced to extension.');
} else {
  chrome.storage.local.remove('invisible_algo_token');
  console.log('[Invisible Algorithm] No dashboard auth token found.');
}