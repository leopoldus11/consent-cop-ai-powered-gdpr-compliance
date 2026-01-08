/**
 * Service Worker-based Network Request Capture
 * 
 * Service Workers run in an isolated context and can intercept ALL fetch() calls,
 * even those that CDP or Playwright might miss. This is a powerful fallback.
 */

export interface ServiceWorkerRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

/**
 * Register a Service Worker that intercepts all network requests
 * This must be called BEFORE navigation
 */
export async function setupServiceWorkerCapture(page: any): Promise<{
  getRequests: () => ServiceWorkerRequest[];
  cleanup: () => void;
}> {
  const requests: ServiceWorkerRequest[] = [];
  
  // Create Service Worker script content
  const swScript = `
    // Service Worker to intercept all fetch requests
    self.addEventListener('fetch', (event) => {
      const request = event.request;
      const requestData = {
        url: request.url,
        method: request.method,
        headers: {},
        body: null,
        timestamp: Date.now(),
      };
      
      // Try to capture headers (may be limited by CORS)
      if (request.headers) {
        request.headers.forEach((value, key) => {
          requestData.headers[key] = value;
        });
      }
      
      // Store request in a way we can retrieve it
      // Use postMessage to send to main thread
      if (self.clients) {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_REQUEST',
              data: requestData
            });
          });
        });
      }
      
      // Continue with the original request
      event.respondWith(fetch(request));
    });
    
    self.addEventListener('install', () => {
      self.skipWaiting();
    });
    
    self.addEventListener('activate', () => {
      self.clients.claim();
    });
  `;
  
  // Inject Service Worker registration script
  await page.addInitScript((swContent: string) => {
    // Create blob URL for Service Worker
    const blob = new Blob([swContent], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);
    
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('[SW] Service Worker registered:', registration.scope);
        })
        .catch(error => {
          console.warn('[SW] Service Worker registration failed:', error);
        });
      
      // Listen for messages from Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_REQUEST') {
          // Store in window for retrieval
          if (!(window as any).__swRequests) {
            (window as any).__swRequests = [];
          }
          (window as any).__swRequests.push(event.data.data);
        }
      });
    }
  }, swScript);
  
  // Periodically retrieve requests from Service Worker
  const retrieveRequests = async () => {
    try {
      if (page.isClosed()) {
        clearInterval(interval);
        return;
      }
      
      const swRequests = await page.evaluate(() => {
        return (window as any).__swRequests || [];
      }).catch(() => []);
      
      // Merge new requests
      swRequests.forEach((req: ServiceWorkerRequest) => {
        if (!requests.find(r => r.url === req.url && r.timestamp === req.timestamp)) {
          requests.push(req);
        }
      });
    } catch (error: any) {
      // Silently fail
      if (!error.message?.includes('Execution context was destroyed')) {
        console.warn('[SW] Error retrieving requests:', error.message);
      }
    }
  };
  
  const interval = setInterval(retrieveRequests, 500);
  
  return {
    getRequests: () => requests,
    cleanup: () => clearInterval(interval),
  };
}



