// Helper functions for async storage
async function getSnackgnitoTab(tabId: number): Promise<string | null> {
  const data = await chrome.storage.session.get(tabId.toString());
  return data[tabId.toString()] !== undefined ? (data[tabId.toString()] as string) : null;
}

async function setSnackgnitoTab(tabId: number, cookieString: string) {
  await chrome.storage.session.set({ [tabId.toString()]: cookieString });
}

async function removeSnackgnitoTab(tabId: number) {
  await chrome.storage.session.remove(tabId.toString());
}

async function checkIfSnackgnitoTab(tabId: number): Promise<boolean> {
  return (await getSnackgnitoTab(tabId)) !== null;
}

function mergeCookieString(existingCookies: string, newCookiePart: string): string {
  const newCookie = newCookiePart.trim();
  if (!newCookie || !newCookie.includes('=')) return existingCookies;
  
  const [newKey, ...newValParts] = newCookie.split('=');
  const newValue = newValParts.join('=');
  
  const currentCookies = existingCookies ? existingCookies.split(';').map(c => c.trim()) : [];
  let found = false;
  
  const updatedCookies = currentCookies.map(c => {
    if (!c.includes('=')) return c;
    const [k] = c.split('=');
    if (k.trim() === newKey.trim()) {
      found = true;
      return `${newKey.trim()}=${newValue}`;
    }
    return c;
  });
  
  if (!found) {
    updatedCookies.push(newCookie);
  }
  
  return updatedCookies.join('; ');
}

// MUST BE ASYNC to prevent race conditions with tab reloading
async function updateDNRRules(tabId: number, cookieString: string) {
  const ruleId = tabId;
  const requestHeaders = cookieString ? [
    { header: "cookie", operation: chrome.declarativeNetRequest.HeaderOperation.SET, value: cookieString }
  ] : [
    { header: "cookie", operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE }
  ];

  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [ruleId],
    addRules: [{
      id: ruleId,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders,
        responseHeaders: [
          { header: "set-cookie", operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE }
        ]
      },
      condition: {
        tabIds: [tabId],
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
          chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
          chrome.declarativeNetRequest.ResourceType.STYLESHEET,
          chrome.declarativeNetRequest.ResourceType.SCRIPT,
          chrome.declarativeNetRequest.ResourceType.IMAGE,
          chrome.declarativeNetRequest.ResourceType.FONT,
          chrome.declarativeNetRequest.ResourceType.OBJECT,
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
          chrome.declarativeNetRequest.ResourceType.PING,
          chrome.declarativeNetRequest.ResourceType.CSP_REPORT,
          chrome.declarativeNetRequest.ResourceType.MEDIA,
          chrome.declarativeNetRequest.ResourceType.WEBSOCKET,
          chrome.declarativeNetRequest.ResourceType.OTHER
        ]
      }
    }]
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-snackgnito-tab",
    title: "Open Link in Snackgnito Tab",
    contexts: ["link"]
  });
  
  chrome.contextMenus.create({
    id: "snackgnito-current-tab",
    title: "Make this a Snackgnito Tab",
    contexts: ["page"]
  });
});

// Restore DNR rules when service worker restarts (MV3 lifecycle)
chrome.runtime.onStartup.addListener(async () => {
  const all = await chrome.storage.session.get();
  for (const [key, value] of Object.entries(all)) {
    const tabId = Number(key);
    if (!isNaN(tabId)) {
      await updateDNRRules(tabId, value as string);
      console.log(`Restored DNR rule for snackgnito tab: ${tabId}`);
    }
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "open-snackgnito-tab" && info.linkUrl) {
    chrome.tabs.create({ url: info.linkUrl }, async (newTab) => {
      if (newTab.id) {
        await setSnackgnitoTab(newTab.id, ""); 
        await updateDNRRules(newTab.id, ""); // Initialize empty cookie jar for this tab
        console.log(`Snackgnito tab created: ${newTab.id}`);
      }
    });
  } else if (info.menuItemId === "snackgnito-current-tab" && tab && tab.id) {
    await setSnackgnitoTab(tab.id, "");
    await updateDNRRules(tab.id, "");
    chrome.tabs.reload(tab.id, { bypassCache: true }); // Reload to ensure proxy scripts initialize cleanly
    console.log(`Current tab snackgnito tab: ${tab.id}`);
  }
});

// Restore DNR rules before navigation request fires (after service worker restart)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    await ensureDNRRulesExist(tabId);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (await checkIfSnackgnitoTab(tabId)) {
    await removeSnackgnitoTab(tabId);
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tabId] });
    console.log(`Snackgnito tab closed, cleaned up state for tab: ${tabId}`);
  }
});

// Handle tab replacements (e.g., navigating from New Tab Page to a website)
chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
  if (await checkIfSnackgnitoTab(removedTabId)) {
    const cookies = await getSnackgnitoTab(removedTabId);
    await setSnackgnitoTab(addedTabId, cookies || "");
    await updateDNRRules(addedTabId, cookies || "");
    await removeSnackgnitoTab(removedTabId);
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [removedTabId] });
    console.log(`Tab replaced: transferred Snackgnito state from ${removedTabId} to ${addedTabId}`);
    // Force a reload to clear any leaked state from the original main_frame navigation
    chrome.tabs.reload(addedTabId, { bypassCache: true });
  }
});

// Observe incoming Set-Cookie headers before DNR strips them
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId !== -1 && details.responseHeaders) {
      getSnackgnitoTab(details.tabId).then(cookieString => {
        if (cookieString !== null) {
          let updatedCookie = cookieString;
          
          details.responseHeaders!.forEach(header => {
            if (header.name.toLowerCase() === 'set-cookie' && header.value) {
              const cookiePart = header.value.split(';')[0];
              updatedCookie = mergeCookieString(updatedCookie, cookiePart);
            }
          });
          
          if (updatedCookie !== cookieString) {
            setSnackgnitoTab(details.tabId, updatedCookie).then(() => {
              updateDNRRules(details.tabId, updatedCookie);
            });
          }
        }
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders", "extraHeaders"]
);

// Restore DNR rules lazily — called before any message handler
// to ensure rules exist after service worker restarts (MV3 lifecycle)
async function ensureDNRRulesExist(tabId: number): Promise<boolean> {
  const cookies = await getSnackgnitoTab(tabId);
  if (cookies === null) return false;

  const existingRules = await chrome.declarativeNetRequest.getSessionRules();
  const ruleExists = existingRules.some(r => r.id === tabId);
  if (!ruleExists) {
    await updateDNRRules(tabId, cookies);
    console.log(`Restored missing DNR rule for tab: ${tabId}`);
  }
  return true;
}

// Handle messages from isolated content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_COOKIES") {
    const tabId = sender.tab?.id;
    if (tabId) {
      ensureDNRRulesExist(tabId).then(() => {
        getSnackgnitoTab(tabId).then(cookies => {
          if (cookies !== null) {
            sendResponse({ isSnackgnitoTab: true, cookies: cookies });
          } else {
            sendResponse({ isSnackgnitoTab: false, cookies: "" });
          }
        });
      });
      return true;
    }
  } else if (message.action === "SET_COOKIE" && message.cookie) {
    const tabId = sender.tab?.id;
    if (tabId) {
      ensureDNRRulesExist(tabId).then(() => {
        getSnackgnitoTab(tabId).then(async (cookieString) => {
          if (cookieString !== null) {
            let updatedCookie = cookieString || "";
            updatedCookie = mergeCookieString(updatedCookie, message.cookie.split(';')[0]);
            await setSnackgnitoTab(tabId, updatedCookie);
            await updateDNRRules(tabId, updatedCookie);
          }
          sendResponse({ success: true });
        });
      });
      return true;
    }
  } else if (message.action === "IS_SNACKGNITO_TAB") {
    ensureDNRRulesExist(message.tabId).then(() => {
      checkIfSnackgnitoTab(message.tabId).then(isSnackgnitoTab => sendResponse({ isSnackgnitoTab }));
    });
    return true;
  } else if (message.action === "TOGGLE_SNACKGNITO") {
    if (message.isSnackgnitoTab) {
      (async () => {
        await setSnackgnitoTab(message.tabId, "");
        await updateDNRRules(message.tabId, "");
        sendResponse({ success: true });
        // Reload AFTER DNR rules are registered so cookies are stripped
        chrome.tabs.reload(message.tabId, { bypassCache: true });
      })();
    } else {
      (async () => {
        await removeSnackgnitoTab(message.tabId);
        await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [message.tabId] });
        sendResponse({ success: true });
        chrome.tabs.reload(message.tabId, { bypassCache: true });
      })();
    }
    return true;
  }
});

chrome.webNavigation.onCreatedNavigationTarget.addListener(async (details) => {
  if (await checkIfSnackgnitoTab(details.sourceTabId)) {
    // Option A: Strict isolation, new empty cookie jar
    await setSnackgnitoTab(details.tabId, "");
    await updateDNRRules(details.tabId, "");
    console.log(`Child tab snackgnito tab (Strict Isolation): ${details.tabId} from ${details.sourceTabId}`);
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-snackgnito") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (tab && tab.id) {
        if (await checkIfSnackgnitoTab(tab.id)) {
          await removeSnackgnitoTab(tab.id);
          await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tab.id] });
          console.log(`Snackgnito toggled OFF via shortcut for tab: ${tab.id}`);
        } else {
          await setSnackgnitoTab(tab.id, "");
          await updateDNRRules(tab.id, "");
          console.log(`Snackgnito toggled ON via shortcut for tab: ${tab.id}`);
        }
        chrome.tabs.reload(tab.id, { bypassCache: true }); // Safe to reload now because DNR is awaited
      }
    });
  }
});
