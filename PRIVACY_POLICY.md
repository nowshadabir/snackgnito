# Privacy Policy for Snackgnito

**Last Updated:** 2026-07-19

Snackgnito ("the Extension") is a browser extension developed by Kazi Nowshad ("the Developer", "we", "us"). We are committed to protecting your privacy. This Privacy Policy explains our practices regarding the collection, use, and disclosure of information when you use Snackgnito.

## 1. Information Collection and Use

**Snackgnito does not collect, store, or transmit any personal information or user data.**

The Extension operates entirely locally on your device. Its primary function is to intercept, isolate, and manage cookies and session data within specific "Snackgnito tabs" to prevent them from interacting with your main browser profile. 

All session data (such as cookies, localStorage, and sessionStorage) managed by the Extension is:
- Stored locally in your browser's ephemeral session memory (`chrome.storage.session`).
- Automatically deleted when the tab is closed or the browser is shut down.
- Never transmitted to any external servers, third-party services, or the Developer.

## 2. Permissions

To function correctly, Snackgnito requires the following browser permissions, which are used strictly for local operation:

- **declarativeNetRequest & webRequest:** Used solely to intercept and modify HTTP headers (like `Set-Cookie` and `Cookie`) to isolate your sessions locally. No browsing data is logged or sent anywhere.
- **scripting & activeTab:** Used to inject the isolation environment into the tabs you explicitly choose to isolate.
- **contextMenus:** Used to provide the right-click "Open Link in Snackgnito Tab" functionality.
- **storage:** Used to temporarily hold the virtual cookies in your browser's local, volatile memory.
- **webNavigation:** Used to detect when you click a link that opens a new tab from an existing Snackgnito tab, so the isolation can be applied to the new tab.
- **Host Permissions (`<all_urls>`):** Snackgnito requires access to all URLs because you may choose to isolate a tab on any website. This access is only active for the specific tabs you isolate and is never used to track your general browsing history.

## 3. Third-Party Services

Snackgnito does not use any third-party analytics, tracking, or advertising services. 

## 4. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.

## 5. Contact Us

If you have any questions or suggestions about our Privacy Policy, please contact us at:
**Email:** hello@nowshadabir.com
**GitHub Issues:** https://github.com/nowshadabir/vapor/issues
