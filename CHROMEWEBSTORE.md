# Chrome Web Store Listing — Snackgnito

> Last Updated: 2026-07-19

## Store Listing

**Extension Name** 
Snackgnito

**Short Description** 
Create instant, single-use isolated tabs that keep your sessions entirely separate from your main browser profile.

**Detailed Description** 
Snackgnito is a lightweight, privacy-focused extension that lets you open single-use tabs with their own isolated cookie jars. It allows you to log into multiple accounts on the same website simultaneously without mixing up sessions or polluting your main browser's cookies.

Key Features:
- Instant Isolation: Open any link in a Snackgnito tab from the context menu, or convert your current tab with a click or keyboard shortcut (Alt+V).
- Complete Session Separation: Snackgnito intercepts and manages cookies in a virtual container, ensuring they never reach your native browser storage.
- Ephemeral by Default: When you close a Snackgnito tab, its session disappears completely. No lingering trackers or leftover data.
- Seamless Navigation: Clicking links within a Snackgnito tab maintains the isolation automatically.

How to use it:
1. Right-click any link and select "Open Link in Snackgnito Tab".
2. Or, click the Snackgnito icon (or press Alt+V) to toggle isolation for your current tab.
3. Browse and log in as usual. Your main browser profile remains completely unaffected.

Privacy First:
Snackgnito processes all cookie isolation locally on your device. It collects absolutely no data, sends nothing to any external servers, and includes zero tracking or analytics.

**Category** 
Productivity

**Single Purpose** 
Provides isolated, single-use browser tabs to keep web sessions strictly separated from the main browser profile.

**Primary Language** 
English


## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | `public/icons/icon-128.png` |
| Screenshot 1 | 1280×800 | ⬜ Not created | |
| Screenshot 2 | 1280×800 | ⬜ Not created | |
| Small Promo Tile | 440×280 | ⬜ Not created | |


## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| declarativeNetRequest | permissions | Necessary to intercept and strip `Set-Cookie` and `Cookie` headers from HTTP requests and responses to maintain session isolation and prevent cookies from reaching the browser's native storage. |
| scripting | permissions | Required to inject the isolation environment (`proxy.ts` and `isolated.ts`) into web pages before they load, ensuring `document.cookie` and `localStorage` are securely proxied. |
| contextMenus | permissions | Allows the user to right-click links and open them directly in an isolated Snackgnito tab. |
| storage | permissions | Used to temporarily store the virtual cookie jars (`chrome.storage.session`) for active Snackgnito tabs. Data is automatically cleared when the browser closes. |
| activeTab | permissions | Required to toggle the isolation state of the currently viewed tab when the user clicks the extension icon or uses the keyboard shortcut. |
| webRequest | permissions | Necessary to passively observe incoming `Set-Cookie` headers from server responses so the extension's virtual cookie jar can be updated accurately in real-time. |
| webNavigation | permissions | Used to detect when a user clicks a link that opens a new tab from an existing Snackgnito tab, allowing the extension to instantly apply the same isolation to the new tab. |
| `<all_urls>` | host_permissions | Essential for the core functionality. Snackgnito must be able to isolate sessions and intercept cookies on ANY website the user chooses to open in a Snackgnito tab. |


## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes


## Privacy Policy

**Privacy Policy URL** 
(Host the contents of PRIVACY_POLICY.md on your GitHub pages or website)


## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free


## Developer Info

**Publisher Name** 
Kazi Nowshad

**Contact Email** 
hello@nowshadabir.com

**Support URL / Email** 
https://github.com/nowshadabir/vapor/issues


## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-07-19 | Initial release of Snackgnito. | Draft |
