// background.js
chrome.runtime.onInstalled.addListener(function() {
    // Set default state to enabled
    chrome.storage.sync.set({cleaningEnabled: true});
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getCleaningState') {
        chrome.storage.sync.get(['cleaningEnabled'], function(result) {
            sendResponse({enabled: result.cleaningEnabled !== false});
        });
        return true; // Keep the message channel open for async response
    }
});
