document.addEventListener('DOMContentLoaded', function() {
  const elements = {
    enabled: document.getElementById('enabled'),
    autoClickMode: document.getElementById('autoClickMode'),
    autoAcceptLogin: document.getElementById('autoAcceptLogin'),
    whitelistInput: document.getElementById('whitelistInput'),
    addWhitelist: document.getElementById('addWhitelist'),
    whitelistList: document.getElementById('whitelistList'),
    viewCookies: document.getElementById('viewCookies'),
    clearAllCookies: document.getElementById('clearAllCookies'),
    clearDomain: document.getElementById('clearDomain'),
    clearDomainCookies: document.getElementById('clearDomainCookies'),
    cookieInfo: document.getElementById('cookieInfo'),
    cookieList: document.getElementById('cookieList'),
    saveSettings: document.getElementById('saveSettings'),
    status: document.getElementById('status')
  };

  function loadSettings() {
    chrome.storage.sync.get(['enabled', 'autoClickMode', 'whitelist', 'autoAcceptLogin'], function(result) {
      elements.enabled.checked = result.enabled !== false;
      elements.autoClickMode.value = result.autoClickMode || 'accept';
      elements.autoAcceptLogin.checked = result.autoAcceptLogin !== false;
      updateWhitelistDisplay(result.whitelist || []);
    });
  }

  function updateWhitelistDisplay(whitelist) {
    elements.whitelistList.innerHTML = '';
    if (whitelist.length === 0) {
      elements.whitelistList.innerHTML = '<p style="color: #666;">No whitelisted sites</p>';
      return;
    }
    
    whitelist.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'whitelist-item';
      item.innerHTML = `
        <span>${domain}</span>
        <button onclick="removeFromWhitelist('${domain}')">Remove</button>
      `;
      elements.whitelistList.appendChild(item);
    });
  }

  window.removeFromWhitelist = function(domain) {
    chrome.storage.sync.get(['whitelist'], function(result) {
      const whitelist = result.whitelist || [];
      const newWhitelist = whitelist.filter(item => item !== domain);
      chrome.storage.sync.set({whitelist: newWhitelist}, function() {
        updateWhitelistDisplay(newWhitelist);
        showStatus('Removed from whitelist', 'success');
      });
    });
  };

  elements.addWhitelist.addEventListener('click', function() {
    const domain = elements.whitelistInput.value.trim();
    if (!domain) {
      showStatus('Please enter a domain name', 'error');
      return;
    }
    
    chrome.storage.sync.get(['whitelist'], function(result) {
      const whitelist = result.whitelist || [];
      if (whitelist.includes(domain)) {
        showStatus('Domain already in whitelist', 'error');
        return;
      }
      
      whitelist.push(domain);
      chrome.storage.sync.set({whitelist: whitelist}, function() {
        updateWhitelistDisplay(whitelist);
        elements.whitelistInput.value = '';
        showStatus('Added to whitelist', 'success');
      });
    });
  });

  elements.viewCookies.addEventListener('click', function() {
    chrome.runtime.sendMessage({action: 'getCookies'}, function(cookies) {
      elements.cookieInfo.style.display = 'block';
      elements.cookieList.innerHTML = '';
      
      if (cookies.length === 0) {
        elements.cookieList.innerHTML = '<p>No cookies found</p>';
        return;
      }
      
      const domainGroups = {};
      cookies.forEach(cookie => {
        if (!domainGroups[cookie.domain]) {
          domainGroups[cookie.domain] = [];
        }
        domainGroups[cookie.domain].push(cookie);
      });
      
      Object.keys(domainGroups).forEach(domain => {
        const domainDiv = document.createElement('div');
        domainDiv.style.marginBottom = '15px';
        domainDiv.innerHTML = `<strong>${domain} (${domainGroups[domain].length} cookies)</strong>`;
        
        domainGroups[domain].forEach(cookie => {
          const cookieDiv = document.createElement('div');
          cookieDiv.style.marginLeft = '20px';
          cookieDiv.style.fontSize = '12px';
          cookieDiv.style.color = '#666';
          cookieDiv.innerHTML = `${cookie.name} - ${cookie.secure ? 'Secure' : 'Non-secure'} - ${cookie.httpOnly ? 'HTTP Only' : 'Accessible'}`;
          domainDiv.appendChild(cookieDiv);
        });
        
        elements.cookieList.appendChild(domainDiv);
      });
    });
  });

  elements.clearAllCookies.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all cookies? This will log you out of all websites.')) {
      chrome.runtime.sendMessage({action: 'clearCookies'}, function(response) {
        if (response.success) {
          showStatus('All cookies cleared', 'success');
          elements.cookieInfo.style.display = 'none';
        }
      });
    }
  });

  elements.clearDomainCookies.addEventListener('click', function() {
    const domain = elements.clearDomain.value.trim();
    if (!domain) {
      showStatus('Please enter a domain name', 'error');
      return;
    }
    
    if (confirm(`Are you sure you want to clear cookies for ${domain}?`)) {
      chrome.runtime.sendMessage({action: 'clearCookies', domain: domain}, function(response) {
        if (response.success) {
          showStatus(`Cookies cleared for ${domain}`, 'success');
          elements.clearDomain.value = '';
          elements.cookieInfo.style.display = 'none';
        }
      });
    }
  });

  elements.saveSettings.addEventListener('click', function() {
    const settings = {
      enabled: elements.enabled.checked,
      autoClickMode: elements.autoClickMode.value,
      autoAcceptLogin: elements.autoAcceptLogin.checked
    };
    
    chrome.storage.sync.set(settings, function() {
      showStatus('Settings saved successfully', 'success');
    });
  });

  function showStatus(message, type) {
    elements.status.textContent = message;
    elements.status.className = `status ${type}`;
    elements.status.style.display = 'block';
    
    setTimeout(() => {
      elements.status.style.display = 'none';
    }, 3000);
  }

  loadSettings();
});