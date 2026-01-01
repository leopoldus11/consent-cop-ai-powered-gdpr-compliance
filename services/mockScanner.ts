
import { ScanResult, RequestLog } from '../types';

export const mockScan = (url: string): Promise<ScanResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const requests: RequestLog[] = [
        {
          id: '1',
          domain: 'google-analytics.com',
          url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-123&cid=456&en=page_view',
          timestamp: Date.now() - 5000,
          type: 'pixel',
          status: 'violation',
          dataTypes: ['Client ID', 'Page View', 'Screen Resolution'],
          parameters: { 
            v: '2', 
            tid: 'G-123', 
            cid: '456.99827361', 
            en: 'page_view', 
            _p: '12321', 
            _z: '1', 
            dl: url,
            dt: 'Shop The New Collection',
            sr: '1920x1080',
            vp: '1440x900'
          }
        },
        {
          id: '2',
          domain: 'facebook.net',
          url: 'https://connect.facebook.net/en_US/fbevents.js',
          timestamp: Date.now() - 4800,
          type: 'script',
          status: 'violation',
          dataTypes: ['IP Address', 'Browser Fingerprint'],
          parameters: { ev: 'PageView', noscript: '1', cd: '{"value": 0, "currency": "USD"}' }
        },
        {
          id: '3',
          domain: 'hotjar.com',
          url: 'https://static.hotjar.com/c/hotjar-123.js',
          timestamp: Date.now() - 4500,
          type: 'script',
          status: 'violation',
          dataTypes: ['Behavioral Tracking'],
          parameters: { hjid: '123', hjsv: '6', _v: '3' }
        },
        {
          id: '4',
          domain: 'trusted-site.com',
          url: 'https://api.trusted-site.com/v1/config',
          timestamp: Date.now() - 1000,
          type: 'xhr',
          status: 'allowed',
          dataTypes: ['Essential Config']
        }
      ];

      // Detect actual services based on URL (for dertour.de specifically)
      // In production, this would be detected by real browser automation
      const isDertour = url.includes('dertour.de');
      
      resolve({
        id: Math.random().toString(36).substring(7),
        url,
        timestamp: new Date().toISOString(),
        riskScore: isDertour ? 75 : 82,
        violationsCount: isDertour ? 2 : 3,
        compliantCount: 1,
        consentBannerDetected: true,
        bannerProvider: isDertour ? 'Usercentrics' : 'OneTrust',  // Actual CMP for dertour.de
        requests: isDertour ? [
          // Adobe Analytics requests (actual for dertour.de)
          {
            id: '1',
            domain: 'adobe.com',
            url: 'https://dertour.de.112.2o7.net/b/ss/dertour.de/1/JS-2.27.0/s123456789',
            timestamp: Date.now() - 5000,
            type: 'pixel',
            status: 'violation',
            dataTypes: ['Visitor ID', 'Page View', 'Custom Variables'],
            parameters: { 
              v: '2.27.0',
              vid: '123456789',
              pe: 'lnk_o',
              pev1: 'page_view',
              pageName: 'Homepage'
            }
          },
          {
            id: '2',
            domain: 'omtrdc.net',
            url: 'https://dertour.de.omtrdc.net/b/ss/dertour.de/1/JS-2.27.0/s123456789',
            timestamp: Date.now() - 4800,
            type: 'pixel',
            status: 'violation',
            dataTypes: ['Analytics Data', 'User Behavior'],
            parameters: { v: '2.27.0', vid: '123456789' }
          },
          {
            id: '3',
            domain: 'usercentrics.com',
            url: 'https://app.usercentrics.com/browser-ui/latest/loader.js',
            timestamp: Date.now() - 4500,
            type: 'script',
            status: 'allowed',
            dataTypes: ['CMP Configuration']
          }
        ] : requests,
        screenshots: {
          before: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc91?auto=format&fit=crop&q=80&w=1000',
          after: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000'
        },
        dataLayers: isDertour ? ['adobeDataLayer', 'digitalData'] : ['google_tag_manager', 'digitalData'],
        tmsDetected: isDertour ? ['Adobe Experience Platform'] : ['Google Tag Manager']  // Actual TMS for dertour.de
      });
    }, 2000);
  });
};
