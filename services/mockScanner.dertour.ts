// TEST VERSION: Mock scanner with dertour.de's actual services
// This demonstrates that Gemini IS working - it will correctly analyze this data
// To use: Rename this file to mockScanner.ts (backup the original first!)

import { ScanResult, RequestLog } from '../types';

export const mockScan = (url: string): Promise<ScanResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const requests: RequestLog[] = [
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
            pageName: 'Homepage',
            server: 'dertour.de'
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
          parameters: { 
            v: '2.27.0',
            vid: '123456789',
            pe: 'lnk_o'
          }
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
      ];

      resolve({
        id: Math.random().toString(36).substring(7),
        url,
        timestamp: new Date().toISOString(),
        riskScore: 75,
        violationsCount: 2,
        compliantCount: 1,
        consentBannerDetected: true,
        bannerProvider: 'Usercentrics',  // ACTUAL CMP for dertour.de
        requests,
        screenshots: {
          before: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc91?auto=format&fit=crop&q=80&w=1000',
          after: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000'
        },
        dataLayers: ['adobeDataLayer', 'digitalData'],
        tmsDetected: ['Adobe Experience Platform']  // ACTUAL TMS for dertour.de
      });
    }, 2000);
  });
};

