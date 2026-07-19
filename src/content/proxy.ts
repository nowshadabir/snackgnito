console.log("[Vapor:Proxy] Initialized in MAIN world.");

let virtualCookies = "";
let isVaporTab = false;

// Listen for updates from the isolated world
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data || event.data.source !== "vapor-isolated") {
    return;
  }
  const payload = event.data.payload;
  if (payload.action === "COOKIE_DATA") {
    isVaporTab = true; // If we get data, this must be a vapor tab
    virtualCookies = payload.cookies;
  }
});

// Ask isolated world for initial cookies to verify if we are a vapor tab
window.postMessage({ source: "vapor-proxy", payload: { action: "GET_COOKIES" } }, "*");

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

// ==========================================
// 1. OVERRIDE document.cookie
// ==========================================
const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');

Object.defineProperty(Document.prototype, 'cookie', {
  get: function() {
    if (isVaporTab) {
      return virtualCookies;
    }
    return originalCookieDescriptor?.get?.call(this);
  },
  set: function(val) {
    if (isVaporTab) {
      virtualCookies = mergeCookieString(virtualCookies, val.split(";")[0]);
      window.postMessage({ source: "vapor-proxy", payload: { action: "SET_COOKIE", cookie: val } }, "*");
      return val;
    }
    return originalCookieDescriptor?.set?.call(this, val);
  }
});

// ==========================================
// 2. OVERRIDE localStorage & sessionStorage
// ==========================================
const fakeLocalStorage = new Map<string, string>();
const fakeSessionStorage = new Map<string, string>();

function createStorageProxy(storageMap: Map<string, string>, originalStorage: Storage) {
  return new Proxy(originalStorage, {
    get: function(target, prop) {
      if (!isVaporTab) {
        const val = target[prop as keyof Storage];
        return typeof val === 'function' ? val.bind(target) : val;
      }
      
      if (prop === 'getItem') return (k: string) => storageMap.has(k) ? (storageMap.get(k) ?? null) : null;
      if (prop === 'setItem') return (k: string, v: string) => storageMap.set(k, String(v));
      if (prop === 'removeItem') return (k: string) => storageMap.delete(k);
      if (prop === 'clear') return () => storageMap.clear();
      if (prop === 'key') return (i: number) => Array.from(storageMap.keys())[i] || null;
      if (prop === 'length') return storageMap.size;
      
      return storageMap.has(prop as string) ? storageMap.get(prop as string) : undefined;
    },
    set: function(target, prop, value) {
      if (!isVaporTab) {
        target[prop as any] = value;
        return true;
      }
      storageMap.set(prop as string, String(value));
      return true;
    },
    deleteProperty: function(target, prop) {
      if (!isVaporTab) {
        delete target[prop as any];
        return true;
      }
      return storageMap.delete(prop as string);
    }
  });
}

try {
  Object.defineProperty(window, 'localStorage', {
    value: createStorageProxy(fakeLocalStorage, window.localStorage),
    writable: false,
    configurable: false,
    enumerable: true
  });
} catch (e) {
  console.warn("[Vapor:Proxy] Could not proxy localStorage", e);
}

try {
  Object.defineProperty(window, 'sessionStorage', {
    value: createStorageProxy(fakeSessionStorage, window.sessionStorage),
    writable: false,
    configurable: false,
    enumerable: true
  });
} catch (e) {
  console.warn("[Vapor:Proxy] Could not proxy sessionStorage", e);
}

export {}; // Ensure it's treated as a module
