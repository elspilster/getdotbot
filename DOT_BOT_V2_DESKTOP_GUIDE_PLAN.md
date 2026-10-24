# Dot Bot Version 2 — Microsoft Guide/Helper
## Development brief and integration plan
Status: experimental; not an official Microsoft product.

### Goal
Extend the existing Dot Bot 1.0 Electron desktop companion with an optional Guide mode. Preserve the existing Companion mode, its personality, installer and released build.

### Architecture
- Renderer: a Guide mode interface, separate from Companion.
- Help library: reviewed Windows and Microsoft product instructions with OS applicability, source and verification date.
- Main process: an explicit allowlist of safe read-only queries and Windows Settings navigation actions.
- Preload: narrow IPC API exposed through contextBridge. Keep contextIsolation enabled, nodeIntegration disabled, sandbox enabled where compatible.
- Action confirmation: renderer asks permission, main process validates the action identifier independently.
- AI: use existing BYO API key configuration, but never allow model output to become a shell command or executable path.
- Privacy: local conversation state where appropriate; no automatic telemetry; clear external AI disclosure.

### Prototype acceptance tests
1. Guide mode opens without changing Companion mode.
2. Finding specifications explains Settings > System > About.
3. Display Settings can open only after an explicit user click.
4. Downloads guidance does not require access to personal files.
5. Windows Update guidance uses supported settings pages.
6. Wi-Fi instructions adapt to the user's Windows version.
7. No unrestricted process execution or arbitrary shell commands.
8. A missing API key cannot break offline help topics.

### Delivery phases
1. Baseline inventory and read-only help prototype.
2. Integrate with desktop Electron app after identifying its actual source tree.
3. Implement and test allowlisted Windows actions.
4. Expand to 100 verified topics and test on Windows 10/11.
5. Beta packaging, privacy/security review and user testing.

### Important integration dependency
This GitHub repository currently contains the Dot Bot website, including microsoft-guide.html. The Electron desktop v1.0 source and build configuration have not been identified here. Do not claim the desktop app is modified or release Version 2 until the correct source is located.

### Branding
Use “Dot Bot — Microsoft Product Guide (independent)” during development. Microsoft name refers to the products being explained; no affiliation or endorsement is implied.
