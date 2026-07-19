console.log("[Vapor:Isolated] Initialized.");

window.addEventListener("message", (event) => {
  // Only accept messages from the same frame and our specific source
  if (event.source !== window || !event.data || event.data.source !== "vapor-proxy") {
    return;
  }

  const payload = event.data.payload;
  
  if (payload.action === "GET_COOKIES") {
    chrome.runtime.sendMessage({ action: "GET_COOKIES" }, (response) => {
      if (response && response.isVaporized) {
        window.postMessage({
          source: "vapor-isolated",
          payload: { action: "COOKIE_DATA", cookies: response.cookies }
        }, "*");
      }
    });
  } else if (payload.action === "SET_COOKIE") {
    chrome.runtime.sendMessage({ action: "SET_COOKIE", cookie: payload.cookie });
  }
});
