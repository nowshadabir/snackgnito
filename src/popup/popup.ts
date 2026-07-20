const toggle = document.getElementById('snackgnito-toggle') as HTMLInputElement;
const toggleBg = document.getElementById('toggle-bg') as HTMLElement;
const badge = document.getElementById('status-badge') as HTMLElement;

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  
  const tabId = tab.id;
  
  // Ask background if this tab is snackgnito tab
  chrome.runtime.sendMessage({ action: "IS_SNACKGNITO_TAB", tabId }, (response) => {
    toggle.checked = response?.isSnackgnitoTab || false;
    toggle.disabled = false;
    toggleBg.classList.remove('opacity-50', 'peer-disabled:cursor-not-allowed');
    updateUI(toggle.checked);
  });
  
  toggle.addEventListener('change', () => {
    const isSnackgnitoTab = toggle.checked;
    updateUI(isSnackgnitoTab);
    
    chrome.runtime.sendMessage({ action: "TOGGLE_SNACKGNITO", tabId, isSnackgnitoTab }, () => {
      window.close();
    });
  });
}

function updateUI(isSnackgnitoTab: boolean) {
  if (isSnackgnitoTab) {
    badge.innerText = "ON";
    badge.classList.remove('bg-gray-200', 'text-gray-500');
    badge.classList.add('bg-emerald-100', 'text-emerald-700');
  } else {
    badge.innerText = "OFF";
    badge.classList.add('bg-gray-200', 'text-gray-500');
    badge.classList.remove('bg-emerald-100', 'text-emerald-700');
  }
}

init();
