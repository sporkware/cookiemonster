document.addEventListener('DOMContentLoaded', function() {
  const elements = {
    statusDiv: document.getElementById('statusDiv'),
    statusText: document.getElementById('statusText'),
    currentSite: document.getElementById('currentSite'),
    enabledToggle: document.getElementById('enabledToggle'),
    modeSelect: document.getElementById('modeSelect'),
    whitelistBtn: document.getElementById('whitelistBtn'),
    optionsBtn: document.getElementById('optionsBtn'),
    manualClickBtn: document.getElementById('manualClickBtn')
  };

  let currentHostname = '';
  let isWhitelisted = false;

  function getCurrentTab(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      callback(tabs[0]);
    });
  }

  function loadSettings() {
    chrome.storage.sync.get(['enabled', 'autoClickMode', 'whitelist', 'autoAcceptLogin'], function(result) {
      elements.enabledToggle.checked = result.enabled !== false;
      elements.modeSelect.value = result.autoClickMode || 'accept';
      updateStatus();
      checkWhitelist(result.whitelist || []);
    });
  }

  function updateStatus() {
    const enabled = elements.enabledToggle.checked;
    const mode = elements.modeSelect.value;
    
    if (!enabled) {
      elements.statusDiv.className = 'status disabled';
      elements.statusText.textContent = 'Disabled';
    } else {
      elements.statusDiv.className = 'status enabled';
      if (mode === 'accept') {
        elements.statusText.textContent = 'Auto-accepting cookies';
      } else if (mode === 'deny') {
        elements.statusText.textContent = 'Auto-denying cookies';
      } else {
        elements.statusText.textContent = 'Enabled but mode is off';
      }
    }
  }

  function checkWhitelist(whitelist) {
    getCurrentTab(function(tab) {
      if (tab && tab.url) {
        try {
          const url = new URL(tab.url);
          currentHostname = url.hostname;
          elements.currentSite.textContent = currentHostname;
          
          isWhitelisted = whitelist.includes(currentHostname);
          updateWhitelistButton();
        } catch (e) {
          elements.currentSite.textContent = 'Invalid URL';
        }
      }
    });
  }

  function updateWhitelistButton() {
    if (isWhitelisted) {
      elements.whitelistBtn.textContent = 'Remove from Whitelist';
      elements.whitelistBtn.className = 'whitelist-btn whitelisted';
    } else {
      elements.whitelistBtn.textContent = 'Add to Whitelist';
      elements.whitelistBtn.className = 'whitelist-btn';
    }
  }

  elements.enabledToggle.addEventListener('change', function() {
    chrome.storage.sync.set({enabled: elements.enabledToggle.checked}, function() {
      updateStatus();
    });
  });

  elements.modeSelect.addEventListener('change', function() {
    chrome.storage.sync.set({autoClickMode: elements.modeSelect.value}, function() {
      updateStatus();
    });
  });

  elements.whitelistBtn.addEventListener('click', function() {
    chrome.storage.sync.get(['whitelist'], function(result) {
      let whitelist = result.whitelist || [];
      
      if (isWhitelisted) {
        whitelist = whitelist.filter(domain => domain !== currentHostname);
        showNotification('Removed from whitelist');
      } else {
        if (!whitelist.includes(currentHostname)) {
          whitelist.push(currentHostname);
          showNotification('Added to whitelist');
        }
      }
      
      chrome.storage.sync.set({whitelist: whitelist}, function() {
        isWhitelisted = !isWhitelisted;
        updateWhitelistButton();
      });
    });
  });

  elements.optionsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  elements.manualClickBtn.addEventListener('click', function() {
    getCurrentTab(function(tab) {
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }, function() {
          showNotification('Manual click triggered');
        });
      }
    });
  });

  function showNotification(message) {
    const originalText = elements.statusText.textContent;
    const originalClass = elements.statusDiv.className;
    
    elements.statusDiv.className = 'status enabled';
    elements.statusText.textContent = message;
    
    setTimeout(() => {
      elements.statusDiv.className = originalClass;
      elements.statusText.textContent = originalText;
    }, 2000);
  }

  loadSettings();
});