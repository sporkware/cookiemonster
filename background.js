chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    autoClickMode: 'accept', // 'accept', 'deny', 'off'
    whitelist: [],
    autoAcceptLogin: true,
    enabled: true
  });
});

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
  }
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
});