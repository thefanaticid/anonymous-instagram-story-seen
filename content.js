// Content script to intercept Instagram story seen requests
(function() {
	'use strict';

	let isActive = false;
	let scriptInjected = false;

	function injectPageScript() {
		if (scriptInjected) return;

		const script = document.createElement('script');
		script.src = chrome.runtime.getURL('injected.js');
		script.setAttribute('data-ig-block-active', isActive);
		script.id = 'ig-stories-blocker';

		const target = document.head || document.documentElement;
		target.appendChild(script);
		scriptInjected = true;
	}

	function updatePageState(active) {
		window.dispatchEvent(new CustomEvent('igStoriesBlockToggle', {
			detail: { isActive: active }
		}));
	}

	// Get initial state from background then inject
	chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
		if (response) {
			isActive = response.isActive;
			injectPageScript();
		} else {
			injectPageScript();
		}
	});

	// Listen for state changes from background
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.action === 'toggleState') {
			isActive = request.isActive;
			updatePageState(isActive);
		}
	});
})();
