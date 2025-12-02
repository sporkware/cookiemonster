chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    autoClickMode: 'accept', // 'accept', 'deny', 'off'
    whitelist: [],
    autoAcceptLogin: true,
    enabled: true,
    acceptedSites: []
  });
});

function setBadge(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url) {
      const hostname = new URL(tab.url).hostname;
      chrome.storage.sync.get(['acceptedSites'], (result) => {
        const accepted = result.acceptedSites || [];
        if (accepted.includes(hostname)) {
          chrome.action.setBadgeText({tabId: tabId, text: '✓'});
          chrome.action.setBadgeBackgroundColor({tabId: tabId, color: '#4CAF50'});
        } else {
          chrome.action.setBadgeText({tabId: tabId, text: ''});
        }
      });
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.sync.get(['enabled', 'whitelist', 'autoClickMode'], (result) => {
      if (!result.enabled) return;
      
      const hostname = new URL(tab.url).hostname;
      const isWhitelisted = result.whitelist.includes(hostname);
      
      if (isWhitelisted || result.autoClickMode !== 'off') {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
      }
    });
    setBadge(tabId);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  setBadge(activeInfo.tabId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['autoClickMode', 'whitelist', 'autoAcceptLogin', 'enabled'], (result) => {
      sendResponse(result);
    });
    return true;
  }
  
  if (request.action === 'getCookies') {
    chrome.cookies.getAll({}, (cookies) => {
      sendResponse(cookies);
    });
    return true;
  }
  
  if (request.action === 'clearCookies') {
    if (request.domain) {
      chrome.cookies.getAll({domain: request.domain}, (cookies) => {
        cookies.forEach(cookie => {
          chrome.cookies.remove({
            url: `https://${cookie.domain}${cookie.path}`,
            name: cookie.name
          });
        });
        sendResponse({success: true});
      });
    } else {
      chrome.cookies.getAll({}, (cookies) => {
        cookies.forEach(cookie => {
          chrome.cookies.remove({
            url: `https://${cookie.domain}${cookie.path}`,
            name: cookie.name
          });
        });
        sendResponse({success: true});
      });
    }
    return true;
  }

  if (request.action === 'addAcceptedSite') {
    const hostname = request.hostname;
    chrome.storage.sync.get(['acceptedSites'], (result) => {
      let accepted = result.acceptedSites || [];
      if (!accepted.includes(hostname)) {
        accepted.push(hostname);
        chrome.storage.sync.set({acceptedSites: accepted});
      }
    });
  }
});