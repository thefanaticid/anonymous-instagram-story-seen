// This script runs in the page context (not isolated like content scripts)
(function() {
	// Get initial state from script tag attribute
	const scriptTag = document.getElementById('ig-stories-blocker') || document.currentScript;
	const initialState = scriptTag ? scriptTag.getAttribute('data-ig-block-active') === 'true' : false;

	// Store the active state
	window.__igStoriesBlockActive = initialState;

	// Listen for toggle events from content script
	window.addEventListener('igStoriesBlockToggle', function(event) {
		window.__igStoriesBlockActive = event.detail.isActive;
	});

	// Intercept fetch
	const originalFetch = window.fetch;
	window.fetch = function(...args) {
		const [url, options] = args;

		if (url && options && options.body) {
			try {
				let shouldBlock = false;

				// Check for seen endpoint
				if (url.includes('/api/v1/stories/reel/seen')) {
					shouldBlock = true;
				}
				// Check graphql mutations
				else if (url.includes('/api/graphql') || url.includes('/graphql/query')) {
					// Check FormData
					if (options.body instanceof FormData) {
						const fbApiReqFriendlyName = options.body.get('fb_api_req_friendly_name');
						const variables = options.body.get('variables');
						
						if (fbApiReqFriendlyName && fbApiReqFriendlyName.includes('Seen') && 
							fbApiReqFriendlyName.includes('Polaris') && 
							fbApiReqFriendlyName.includes('Mutation')) {
							try {
								const vars = JSON.parse(variables || '{}');
								if ('viewSeenAt' in vars) {
									shouldBlock = true;
								}
							} catch (e) {}
						}
					}
					// Check string body
					else if (typeof options.body === 'string') {
						if (options.body.includes('viewSeenAt')) {
							shouldBlock = true;
						}
					}
				}

				if (shouldBlock && window.__igStoriesBlockActive) {
					return Promise.resolve(new Response(
						JSON.stringify({ data: {}, status: 'ok' }),
						{
							status: 200,
							statusText: 'OK',
							headers: { 'Content-Type': 'application/json' }
						}
					));
				}
			} catch (e) {}
		}

		return originalFetch.apply(this, args);
	};

	// Intercept XMLHttpRequest
	const XHR = XMLHttpRequest.prototype;
	const originalOpen = XHR.open;
	const originalSend = XHR.send;

	XHR.open = function(method, url) {
		this._url = url;
		this._method = method;
		return originalOpen.apply(this, arguments);
	};

	XHR.send = function(body) {
		if (this._url && body) {
			try {
				let shouldBlock = false;

				// Check for seen endpoint
				if (this._url.includes('/api/v1/stories/reel/seen')) {
					shouldBlock = true;
				}
				// Check graphql mutations
				else if (this._url.includes('/api/graphql') || this._url.includes('/graphql/query')) {
					// Check FormData
					if (body instanceof FormData) {
						const fbApiReqFriendlyName = body.get('fb_api_req_friendly_name');
						const variables = body.get('variables');
						
						if (fbApiReqFriendlyName && fbApiReqFriendlyName.includes('Seen') && 
							fbApiReqFriendlyName.includes('Polaris') && 
							fbApiReqFriendlyName.includes('Mutation')) {
							try {
								const vars = JSON.parse(variables || '{}');
								if ('viewSeenAt' in vars) {
									shouldBlock = true;
								}
							} catch (e) {}
						}
					}
					// Check string body
					else if (typeof body === 'string') {
						if (body.includes('viewSeenAt')) {
							shouldBlock = true;
						}
					}
				}

				if (shouldBlock && window.__igStoriesBlockActive) {
					// Don't send the request
					return;
				}
			} catch (e) {}
		}

		return originalSend.apply(this, arguments);
	};
})();
