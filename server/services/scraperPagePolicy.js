import { assertPropertyUrl } from './outboundPolicy.js';

export async function protectScraperPage(page) {
    await page.setBypassServiceWorker(true);
    await page.setRequestInterception(true);
    const handle = request => {
        if (request.isInterceptResolutionHandled()) return;
        let allowed = false;
        try {
            if (request.isNavigationRequest()) {
                assertPropertyUrl(request.url());
                allowed = true;
            } else {
                const url = new URL(request.url());
                // Subresources still pass through the IP-pinning proxy.
                allowed = url.protocol === 'https:' && !url.username && !url.password && !url.port;
            }
        } catch { /* Reject unsupported protocols and malformed URLs. */ }
        const operation = allowed ? request.continue() : request.abort('blockedbyclient');
        void operation.catch(() => {}); // Page closure can race interception.
    };
    page.on('request', handle);
    return async () => {
        // Release intercepted requests before closing the target (Chromium 155).
        try { await page.setRequestInterception(false); }
        finally { page.off('request', handle); }
    };
}
