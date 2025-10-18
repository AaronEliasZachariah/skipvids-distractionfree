// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('cleaningToggle');
    const status = document.getElementById('status');

    // Get the current state from storage
    chrome.storage.sync.get(['cleaningEnabled'], function(result) {
        const isEnabled = result.cleaningEnabled !== false; // Default to true
        toggle.checked = isEnabled;
        updateStatus(isEnabled);
    });

    // Handle toggle changes
    toggle.addEventListener('change', function() {
        const isEnabled = toggle.checked;
        chrome.storage.sync.set({cleaningEnabled: isEnabled}, function() {
            updateStatus(isEnabled);

            // Notify content scripts to update immediately
            chrome.tabs.query({url: "*://skipvids.com/*"}, function(tabs) {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'toggleCleaning',
                        enabled: isEnabled
                    }).catch(err => {
                        // Ignore errors for tabs that don't have the content script
                        console.log('Tab may not have content script:', err.message);
                    });
                });
            });
        });
    });

    function updateStatus(enabled) {
        if (enabled) {
            status.textContent = 'Cleaning enabled - Search & Footer hidden';
            status.style.color = '#4CAF50';
        } else {
            status.textContent = 'Cleaning disabled - All elements visible';
            status.style.color = '#666';
        }
    }
});
