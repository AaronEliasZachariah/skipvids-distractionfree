// content.js
(function () {
    const SEARCH_SELECTORS = [
      '.search-container',
      '.search-bar',
      '.search',
      '[role="search"]',
      'input[type="search"]',
      'input[placeholder*="Search"]'
    ];

    const FOOTER_SELECTORS = [
      'footer',
      '#footer',
      '.footer',
      '[role="contentinfo"]',
      '.site-footer',
      '.main-footer'
    ];

    let cleaningEnabled = true;
    let styleElement = null;

    // Get cleaning state from storage
    function getCleaningState(callback) {
        chrome.runtime.sendMessage({action: 'getCleaningState'}, function(response) {
            if (response && typeof response.enabled === 'boolean') {
                callback(response.enabled);
            } else {
                callback(true); // Default to enabled
            }
        });
    }

    // Update cleaning state
    function updateCleaningState(enabled) {
        cleaningEnabled = enabled;
        if (enabled) {
            injectHideCSS();
            removeMatchingElements();
        } else {
            removeInjectedCSS();
            restoreElements();
        }
    }

    // Inject CSS hide rule for robustness
    function injectHideCSS() {
        if (styleElement) {
            styleElement.remove();
        }

        const searchCss = SEARCH_SELECTORS.join(', ') + ' { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }';
        const footerCss = FOOTER_SELECTORS.join(', ') + ' { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }';
        const css = searchCss + ' ' + footerCss;

        styleElement = document.createElement('style');
        styleElement.setAttribute('data-skipvids-cleaner', 'true');
        styleElement.textContent = css;
        document.head?.appendChild(styleElement);
    }

    // Remove injected CSS
    function removeInjectedCSS() {
        if (styleElement) {
            styleElement.remove();
            styleElement = null;
        }
    }

    // Store original elements for restoration
    let removedElements = new Map();

    // Remove matching elements and return how many were removed
    function removeMatchingElements() {
        if (!cleaningEnabled) return 0;

        let removed = 0;

        // Remove search elements
        for (const sel of SEARCH_SELECTORS) {
            const nodes = document.querySelectorAll(sel);
            nodes.forEach(n => {
                // remove only if visible or exists
                if (n && n.parentNode) {
                    // Store element for potential restoration
                    if (!removedElements.has(sel)) {
                        removedElements.set(sel, []);
                    }
                    removedElements.get(sel).push({
                        element: n.cloneNode(true),
                        parent: n.parentNode,
                        nextSibling: n.nextSibling
                    });
                    n.remove();
                    removed += 1;
                }
            });
        }

        // Remove footer elements
        for (const sel of FOOTER_SELECTORS) {
            const nodes = document.querySelectorAll(sel);
            nodes.forEach(n => {
                // remove only if visible or exists
                if (n && n.parentNode) {
                    // Store element for potential restoration
                    if (!removedElements.has(sel)) {
                        removedElements.set(sel, []);
                    }
                    removedElements.get(sel).push({
                        element: n.cloneNode(true),
                        parent: n.parentNode,
                        nextSibling: n.nextSibling
                    });
                    n.remove();
                    removed += 1;
                }
            });
        }

        if (removed) console.log(`SkipVids Cleaner: removed ${removed} element(s) (search + footer).`);
        return removed;
    }

    // Restore removed elements
    function restoreElements() {
        removedElements.forEach((elements, selector) => {
            elements.forEach(({element, parent, nextSibling}) => {
                if (parent && !parent.querySelector(selector)) {
                    parent.insertBefore(element, nextSibling);
                }
            });
        });
        removedElements.clear();
    }
  
    // Observe DOM changes (for dynamic loading)
    function startObserver() {
      const observer = new MutationObserver((mutations) => {
        // small optimisation: if body not ready, skip
        if (!document.body) return;
        // try removing matches (the injected CSS already hides them, but we also remove)
        if (cleaningEnabled) {
          removeMatchingElements();
        }
      });

      observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
    }
  
    // Run once and set up observer
    function init() {
      try {
        // Get initial state
        getCleaningState(function(enabled) {
          updateCleaningState(enabled);

          // also attempt again after short delays in case of late scripts
          if (enabled) {
            setTimeout(removeMatchingElements, 1000);
            setTimeout(removeMatchingElements, 3000);
          }

          startObserver();
          console.log('SkipVids Cleaner: initialised');
        });
      } catch (e) {
        console.error('SkipVids Cleaner error:', e);
      }
    }
  
    // Listen for toggle messages from popup
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'toggleCleaning') {
            updateCleaningState(request.enabled);
            sendResponse({success: true});
        }
    });

    // Wait for DOMContentLoaded if needed
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
  