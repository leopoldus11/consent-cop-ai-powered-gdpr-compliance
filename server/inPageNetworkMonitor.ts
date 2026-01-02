/**
 * In-Page Network Monitoring
 * 
 * Uses fetch() inside page.evaluate() to ensure requests carry authentic browser context
 * This bypasses CDP detection by making requests from the page context itself
 */

export interface InPageRequest {
  url: string;
  method: string;
  status: number;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

/**
 * Monitor network requests from within the page context
 * This ensures requests appear to come from the actual browser, not CDP
 */
export async function setupInPageNetworkMonitor(page: any): Promise<{
  getRequests: () => InPageRequest[];
  cleanup: () => void;
}> {
  const requests: InPageRequest[] = [];
  
  // Inject network monitoring script into page context (Playwright uses addInitScript)
  await page.addInitScript(() => {
    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest.prototype.open;
    const originalSend = window.XMLHttpRequest.prototype.send;
    
    // Monitor fetch() calls
    window.fetch = async function(...args: any[]) {
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const options = typeof args[0] === 'string' ? args[1] : args[0];
      
      const request: InPageRequest = {
        url,
        method: options?.method || 'GET',
        status: 0,
        headers: options?.headers || {},
        body: options?.body,
        timestamp: Date.now(),
      };
      
      // Store in window for retrieval
      if (!(window as any).__inPageRequests) {
        (window as any).__inPageRequests = [];
      }
      (window as any).__inPageRequests.push(request);
      
      try {
        const response = await originalFetch.apply(this, args as any);
        request.status = response.status;
        
        // Update stored request
        const stored = (window as any).__inPageRequests.find((r: InPageRequest) => r.url === url && r.timestamp === request.timestamp);
        if (stored) {
          stored.status = response.status;
        }
        
        return response;
      } catch (error) {
        console.error('[IN-PAGE] Fetch error:', error);
        return originalFetch.apply(this, args as any);
      }
    };
    
    // Monitor XMLHttpRequest
    window.XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
      const request: InPageRequest = {
        url: typeof url === 'string' ? url : url.toString(),
        method,
        status: 0,
        headers: {},
        timestamp: Date.now(),
      };
      
      if (!(window as any).__inPageRequests) {
        (window as any).__inPageRequests = [];
      }
      (window as any).__inPageRequests.push(request);
      
      return originalXHR.apply(this, [method, url, ...rest] as any);
    };
    
    window.XMLHttpRequest.prototype.send = function(body?: any) {
      const requests = (window as any).__inPageRequests || [];
      if (requests.length > 0) {
        const lastRequest = requests[requests.length - 1];
        if (body) {
          lastRequest.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
      }
      
      this.addEventListener('load', function() {
        const requests = (window as any).__inPageRequests || [];
        if (requests.length > 0) {
          const lastRequest = requests[requests.length - 1];
          lastRequest.status = this.status;
        }
      });
      
      return originalSend.apply(this, [body]);
    };
    
    console.log('[IN-PAGE] Network monitoring initialized');
  });
  
  // FIX 2: Periodically retrieve requests from page context (with error handling)
  const retrieveRequests = async () => {
    try {
      // Check if page is still valid
      if (page.isClosed()) {
        clearInterval(interval);
        return;
      }
      
      const pageRequests = await page.evaluate(() => {
        return (window as any).__inPageRequests || [];
      }).catch(() => []); // Return empty array on error (e.g., during navigation)
      
      // Merge new requests
      pageRequests.forEach((req: InPageRequest) => {
        if (!requests.find(r => r.url === req.url && r.timestamp === req.timestamp)) {
          requests.push(req);
        }
      });
    } catch (error: any) {
      // Silently fail during navigation (Execution context destroyed is expected)
      if (!error.message?.includes('Execution context was destroyed') && 
          !error.message?.includes('Target closed')) {
        console.warn('[IN-PAGE] Error retrieving requests:', error.message);
      }
    }
  };
  
  // Set up periodic retrieval
  const interval = setInterval(retrieveRequests, 500);
  
  // Return cleanup function and requests array
  // Note: This is a workaround - we'll access requests directly from the array
  const monitor = {
    getRequests: () => requests,
    cleanup: () => clearInterval(interval),
  };
  
  return monitor;
}

