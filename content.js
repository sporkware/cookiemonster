(function() {
  const consentSelectors = [
    // Common accept buttons
    'button[id*="accept"]',
    'button[id*="agree"]',
    'button[id*="consent"]',
    'button[class*="accept"]',
    'button[class*="agree"]',
    'button[class*="consent"]',
    'a[id*="accept"]',
    'a[class*="accept"]',
    'button[aria-label*="accept"]',
    'button[aria-label*="agree"]',
    
    // Specific cookie consent banners
    '#cookie-consent-button',
    '#accept-cookies',
    '#accept-all-cookies',
    '.cookie-consent-button',
    '.accept-cookies',
    '.accept-all',
    '.consent-accept',
    '.gdpr-accept',
    '.cc-accept',
    '.qc-cmp-button',
    '.js-cookie-consent',
    
    // Common deny buttons
    'button[id*="reject"]',
    'button[id*="deny"]',
    'button[class*="reject"]',
    'button[class*="deny"]',
    'a[id*="reject"]',
    'a[class*="reject"]',
    'button[aria-label*="reject"]',
    'button[aria-label*="deny"]',
    '#reject-cookies',
    '#reject-all',
    '.reject-cookies',
    '.reject-all',
    '.gdpr-reject',
    '.cc-reject',
    
    // Close buttons for popups
    '.cookie-banner-close',
    '.consent-close',
    '[aria-label*="close"]',
    '.close',
    '#close'
  ];

  let clickAttempts = 0;
  const maxAttempts = 10;

  function getSettings(callback) {
    chrome.runtime.sendMessage({action: 'getSettings'}, callback);
  }

  function isLoginSite() {
    const loginIndicators = [
      'login', 'signin', 'sign-in', 'auth', 'authenticate',
      'account', 'profile', 'dashboard', 'user', 'session'
    ];
    
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    return loginIndicators.some(indicator => 
      url.includes(indicator) || pathname.includes(indicator)
    );
  }

  function clickConsentButton(mode) {
    const acceptKeywords = ['accept', 'agree', 'consent', 'allow', 'continue'];
    const rejectKeywords = ['reject', 'deny', 'decline', 'refuse'];
    
    let targetButton = null;
    
    if (mode === 'accept') {
      targetButton = findButtonByKeywords(acceptKeywords);
    } else if (mode === 'deny') {
      targetButton = findButtonByKeywords(rejectKeywords);
    }
    
    if (targetButton) {
      targetButton.click();
      console.log(`Cookie Consent Auto-Clicker: Clicked ${mode} button`);
      return true;
    }
    
    return false;
  }

  function findButtonByKeywords(keywords) {
    for (const selector of consentSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = (element.textContent || element.innerText || '').toLowerCase();
        const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
        const id = (element.id || '').toLowerCase();
        const className = (element.className || '').toLowerCase();
        
        if (keywords.some(keyword => 
          text.includes(keyword) || 
          ariaLabel.includes(keyword) || 
          id.includes(keyword) || 
          className.includes(keyword)
        )) {
          return element;
        }
      }
    }
    return null;
  }

  function handleConsent() {
    getSettings((settings) => {
      if (!settings.enabled) return;
      
      const hostname = window.location.hostname;
      const isWhitelisted = settings.whitelist.includes(hostname);
      const shouldAutoAcceptLogin = settings.autoAcceptLogin && isLoginSite();
      
      let mode = settings.autoClickMode;
      
      if (isWhitelisted || shouldAutoAcceptLogin) {
        mode = 'accept';
      }
      
      if (mode === 'off') return;
      
      if (clickConsentButton(mode)) {
        clickAttempts = 0;
      } else if (clickAttempts < maxAttempts) {
        clickAttempts++;
        setTimeout(handleConsent, 1000);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleConsent);
  } else {
    handleConsent();
  }

  setTimeout(handleConsent, 2000);
  setTimeout(handleConsent, 5000);
})();