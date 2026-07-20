import tailwindStyles from './overlay.css?inline';

console.log("[Snackgnito:UI] Overlay injected.");

// Only mount if the isolated script tells us this is a Snackgnito tab
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data || event.data.source !== "snackgnito-isolated") {
    return;
  }
  
  const payload = event.data.payload;
  // If we receive cookie data, it means it's a snackgnito tab! Mount the UI.
  if (payload.action === "COOKIE_DATA" && !document.getElementById('snackgnito-ui-root')) {
    mountUI();
  }
});

function mountUI() {
  const container = document.createElement('div');
  container.id = 'snackgnito-ui-root';
  // Use a very high z-index to ensure it sits on top of everything
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none'; // Click through
  container.style.zIndex = '2147483647';
  
  const shadowRoot = container.attachShadow({ mode: 'open' });
  
  // Inject Tailwind CSS
  const style = document.createElement('style');
  style.textContent = tailwindStyles;
  shadowRoot.appendChild(style);

  // Inject UI
  const wrapper = document.createElement('div');
  wrapper.className = "w-full h-full relative font-sans";
  
  // The subtle viewport border
  const border = document.createElement('div');
  border.className = "absolute inset-0 border-[3px] border-black/10 box-border mix-blend-difference";
  wrapper.appendChild(border);
  
  // The pill
  const pillContainer = document.createElement('div');
  pillContainer.className = "absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto transition-transform hover:scale-105 duration-300 cursor-pointer";
  pillContainer.title = "This tab is isolated by Snackgnito.";
  
  const pill = document.createElement('div');
  pill.className = "flex items-center justify-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-gray-900 font-medium text-sm";
  
  const icon = document.createElement('div');
  icon.className = "text-emerald-500 animate-pulse";
  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`; // Just using a generic safe/secure icon for now
  
  const text = document.createElement('span');
  text.innerText = "Snackgnito Tab";
  text.className = "tracking-wide";
  
  pill.appendChild(icon);
  pill.appendChild(text);
  pillContainer.appendChild(pill);
  wrapper.appendChild(pillContainer);
  
  shadowRoot.appendChild(wrapper);
  document.documentElement.appendChild(container);
}
