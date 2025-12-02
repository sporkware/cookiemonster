# Chrome Extension Development Guidelines

## Build/Test Commands
- Load extension: Chrome → Extensions → Developer mode → Load unpacked
- Test: Load in Chrome and check console for errors
- No build process required - direct file editing

## Code Style Guidelines
- Use manifest v3 syntax and Chrome extension APIs
- JavaScript: ES6+ features, async/await preferred over callbacks
- Use chrome.storage.sync for settings persistence
- Content scripts: wrap in IIFE to avoid global namespace pollution
- Event listeners: use addEventListener with proper error handling
- CSS: use BEM-style naming, mobile-first responsive design
- HTML: semantic tags, proper accessibility attributes
- Error handling: try/catch blocks, user-friendly error messages
- Security: validate inputs, avoid inline scripts, use CSP