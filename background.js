// Initialize state
let isActive = false;

// Initialize badge on startup
chrome.action.setBadgeBackgroundColor({ color: isActive ? '#0097ff' : '#777' });
chrome.action.setBadgeText({ text: isActive ? 'On' : 'Off' });

// Load saved state from storage
chrome.storage.local.get(['isActive'], (result) => {
	if (result.isActive !== undefined) {
		isActive = result.isActive;
	}
	updateBadge();
});

function updateBadge() {
	chrome.action.setBadgeBackgroundColor({ color: isActive ? '#0097ff' : '#777' });
	chrome.action.setBadgeText({ text: isActive ? 'On' : 'Off' });
}

// Handle extension icon click
chrome.action.onClicked.addListener(async () => {
	isActive = !isActive;

	// Save state
	await chrome.storage.local.set({ isActive: isActive });

	// Update badge
	updateBadge();

	// Notify all Instagram tabs about the state change
	const tabs = await chrome.tabs.query({ url: 'https://*.instagram.com/*' });
	tabs.forEach(tab => {
		chrome.tabs.sendMessage(tab.id, {
			action: 'toggleState',
			isActive: isActive
		}).catch(() => {
			// Ignore errors for tabs where content script isn't loaded yet
		});
	});
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'getState') {
		sendResponse({ isActive: isActive });
		return true;
	}
});
