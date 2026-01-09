
import { BeaconType, ParsedBeacon, ParameterInfo, ParameterCategory, DataResidencyInfo } from '../../types';
import { PARAM_MAP } from './ForensicConstants';
import { getAdequacyStatus, isEEACountry } from './DataResidencyConstants.js';

const deepDecode = (str: string): string => {
    let prev = '';
    let curr = str;
    // Decode up to 3 times to handle extreme double/triple encoding
    for (let i = 0; i < 3; i++) {
        try {
            prev = curr;
            curr = decodeURIComponent(curr);
            if (prev === curr) break;
        } catch (e) {
            break;
        }
    }
    return curr;
};

/**
 * GDPR 2026: Geo-IP Lookup for Data Residency Tracking
 * 
 * Strategy:
 * 1. First check static known vendor database (instant, free)
 * 2. Fall back to ip-api.com (supports domains, 45 req/min free)
 * 
 * Tracks cross-border data transfers under Article 44-49 GDPR
 */
const geoIPCache = new Map<string, DataResidencyInfo>();

// Known tracking vendor headquarters (reduces API calls, improves accuracy)
const KNOWN_VENDOR_RESIDENCY: Record<string, { country: string; countryCode: string }> = {
    // Google (US)
    'google-analytics.com': { country: 'United States', countryCode: 'US' },
    'googletagmanager.com': { country: 'United States', countryCode: 'US' },
    'googleadservices.com': { country: 'United States', countryCode: 'US' },
    'doubleclick.net': { country: 'United States', countryCode: 'US' },
    'google.com': { country: 'United States', countryCode: 'US' },
    'google.de': { country: 'United States', countryCode: 'US' }, // Still US HQ
    
    // Meta (US/Ireland)
    'facebook.com': { country: 'United States', countryCode: 'US' },
    'facebook.net': { country: 'United States', countryCode: 'US' },
    'fbcdn.net': { country: 'United States', countryCode: 'US' },
    
    // Adobe (US)
    'demdex.net': { country: 'United States', countryCode: 'US' },
    'omtrdc.net': { country: 'United States', countryCode: 'US' },
    'adobedtm.com': { country: 'United States', countryCode: 'US' },
    '2o7.net': { country: 'United States', countryCode: 'US' },
    
    // TikTok (China/Singapore)
    'tiktok.com': { country: 'China', countryCode: 'CN' },
    'tiktokw.us': { country: 'United States', countryCode: 'US' },
    'byteoversea.com': { country: 'Singapore', countryCode: 'SG' },
    
    // Microsoft/Bing (US)
    'bing.com': { country: 'United States', countryCode: 'US' },
    'clarity.ms': { country: 'United States', countryCode: 'US' },
    
    // Criteo (France - EU!)
    'criteo.com': { country: 'France', countryCode: 'FR' },
    'criteo.net': { country: 'France', countryCode: 'FR' },
    
    // Trade Desk (US)
    'adsrvr.org': { country: 'United States', countryCode: 'US' },
    
    // AppNexus/Xandr (US)
    'adnxs.com': { country: 'United States', countryCode: 'US' },
    
    // Teads (France - EU!)
    'teads.tv': { country: 'France', countryCode: 'FR' },
    
    // Rubicon (US)
    'rubiconproject.com': { country: 'United States', countryCode: 'US' },
    
    // Sojern (US)
    'sojern.com': { country: 'United States', countryCode: 'US' },
    
    // Pinterest (US)
    'pinimg.com': { country: 'United States', countryCode: 'US' },
    
    // Usercentrics (Germany - EU!)
    'usercentrics.eu': { country: 'Germany', countryCode: 'DE' },
    'usercentrics.com': { country: 'Germany', countryCode: 'DE' },
    
    // Cloudfront (US)
    'cloudfront.net': { country: 'United States', countryCode: 'US' },
    
    // Contentstack (US)
    'contentstack.com': { country: 'United States', countryCode: 'US' },
    
    // SmartSeer
    'smartseer.com': { country: 'United States', countryCode: 'US' },
    
    // AdUp (Germany - EU!)
    'adup-tech.com': { country: 'Germany', countryCode: 'DE' },
    
    // Roeye/Lantern
    'roeye.com': { country: 'United Kingdom', countryCode: 'GB' },
    'roeyecdn.com': { country: 'United Kingdom', countryCode: 'GB' },
    
    // AGKN
    'agkn.com': { country: 'United States', countryCode: 'US' },
};

function getKnownVendorResidency(domain: string): { country: string; countryCode: string } | null {
    // Check exact match first
    if (KNOWN_VENDOR_RESIDENCY[domain]) {
        return KNOWN_VENDOR_RESIDENCY[domain];
    }
    
    // Check parent domains (e.g., metrics.dertour.de should match dertour.de)
    const parts = domain.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
        const parentDomain = parts.slice(i).join('.');
        if (KNOWN_VENDOR_RESIDENCY[parentDomain]) {
            return KNOWN_VENDOR_RESIDENCY[parentDomain];
        }
    }
    
    return null;
}

async function lookupDataResidency(domain: string): Promise<DataResidencyInfo> {
    // Check cache first
    if (geoIPCache.has(domain)) {
        return geoIPCache.get(domain)!;
    }

    // Step 1: Check known vendor database (instant, free)
    const knownVendor = getKnownVendorResidency(domain);
    if (knownVendor) {
        const isEEA = isEEACountry(knownVendor.countryCode);
        const adequacyStatus = getAdequacyStatus(knownVendor.countryCode);
        
        const result: DataResidencyInfo = {
            requestDomain: domain,
            country: knownVendor.country,
            countryCode: knownVendor.countryCode,
            isEEA,
            adequacyStatus
        };
        
        geoIPCache.set(domain, result);
        console.log(`[GEO-IP] ${domain} -> ${result.country} (${result.countryCode}) [${result.adequacyStatus}] [KNOWN_VENDOR]`);
        return result;
    }

    // Step 2: Fall back to ip-api.com (supports domains directly)
    try {
        console.log(`[GEO-IP] Looking up data residency for: ${domain}`);
        
        // ip-api.com supports domain names directly and has higher rate limits
        const response = await fetch(`http://ip-api.com/json/${domain}?fields=status,message,country,countryCode,query`, {
            headers: {
                'User-Agent': 'Consentinel-GDPR-Auditor/2.0'
            },
            signal: AbortSignal.timeout(3000) // 3s timeout
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        // Handle API errors
        if (data.status === 'fail') {
            throw new Error(data.message || 'API error');
        }

        const countryCode = data.countryCode || '';
        const isEEA = isEEACountry(countryCode);
        const adequacyStatus = getAdequacyStatus(countryCode);

        const result: DataResidencyInfo = {
            requestDomain: domain,
            resolvedIP: data.query,
            country: data.country,
            countryCode,
            isEEA,
            adequacyStatus
        };

        // Cache result
        geoIPCache.set(domain, result);
        
        console.log(`[GEO-IP] ${domain} -> ${result.country} (${result.countryCode}) [${result.adequacyStatus}]`);
        return result;

    } catch (error: any) {
        console.warn(`[GEO-IP] Lookup failed for ${domain}: ${error.message}`);
        
        // Return unknown status on failure
        const fallback: DataResidencyInfo = {
            requestDomain: domain,
            isEEA: false,
            adequacyStatus: 'UNKNOWN'
        };
        
        // Cache fallback to avoid repeated failures
        geoIPCache.set(domain, fallback);
        return fallback;
    }
}


export const parseBeaconUrl = async (url: string, id: string): Promise<ParsedBeacon> => {
    if (!url || url.trim() === '') {
        return { id, type: BeaconType.UNKNOWN, rawUrl: '', parameters: [], errors: [] };
    }

    const type = detectType(url);
    const params: ParameterInfo[] = [];
    const errors: string[] = [];

    // Parse Query String
    const urlParts = url.split('?');
    const queryString = urlParts.length > 1 ? urlParts[1] : urlParts[0];

    // URLSearchParams doesn't handle fragments well, strip them if present in the query part
    const cleanQuery = queryString.split('#')[0];
    const searchParams = new URLSearchParams(cleanQuery);

    const typeKey = getTypeKey(type);
    const metadata = PARAM_MAP[typeKey] || {};

    // Check for mandatory fields
    if (type !== BeaconType.UNKNOWN) {
        Object.entries(metadata).forEach(([key, info]) => {
            if (info.mandatory && !searchParams.has(key)) {
                errors.push(`Missing mandatory parameter: ${key} (${info.friendlyName})`);
            }
        });
    }

    // Iterate over search params to also capture duplicate keys if any (URLSearchParams allows duplicates)
    // But for this use case, we might just iterate keys. 
    // Standard URLSearchParams forEach iterates over all value/key pairs.
    searchParams.forEach((value, key) => {
        let paramInfo = metadata[key];
        const decodedValue = deepDecode(value);

        if (!paramInfo) {
            // Dynamic Meta cd[...] matching
            if (type === BeaconType.META && key.startsWith('cd[')) {
                paramInfo = metadata[key] || { friendlyName: `Custom Data (${key.slice(3, -1)})`, description: 'Custom Meta event property', category: ParameterCategory.CUSTOM };
            }

            // GA4 prefixes
            if (type === BeaconType.GA4) {
                if (key.startsWith('ep.')) paramInfo = { friendlyName: `Event Param: ${key.slice(3)}`, description: 'GA4 Event Parameter', category: ParameterCategory.CUSTOM };
                if (key.startsWith('up.')) paramInfo = { friendlyName: `User Prop: ${key.slice(3)}`, description: 'GA4 User Property', category: ParameterCategory.USER };
            }

            // Adobe eVars/Props
            if (type === BeaconType.ADOBE) {
                const evarMatch = key.match(/^v(\d+)$/);
                const propMatch = key.match(/^c(\d+)$/);

                // CUSTOM VARIABLE MAP (Mocked based on user screenshot for dertour.de)
                const ADOBE_VAR_MAP: Record<string, string> = {
                    'v2': 'Standardize v2 Allocation', // Example from screenshot context
                    'v5': 'Passenger Count', // Explicitly requested
                    'v11': 'Time Parting',
                    'v99': 'Environment Logic (Browser Context)',
                    'v131': 'Search/State Context',
                    'c2': 'prop2', // Default fallback
                    'c10': 'Page ID / Channel',
                    'c17': 'Page Name (Copy)',
                    'c20': 'Server (Copy)'
                };

                if (evarMatch) {
                    const varKey = `v${evarMatch[1]}`;
                    const customName = ADOBE_VAR_MAP[varKey];
                    paramInfo = {
                        friendlyName: customName ? `${customName} (${varKey})` : `eVar${evarMatch[1]}`,
                        description: 'Adobe Custom Conversion Variable',
                        category: ParameterCategory.CUSTOM
                    };
                }
                if (propMatch) {
                    const varKey = `c${propMatch[1]}`;
                    const customName = ADOBE_VAR_MAP[varKey];
                    paramInfo = {
                        friendlyName: customName ? `${customName} (${varKey})` : `prop${propMatch[1]}`,
                        description: 'Adobe Custom Traffic Variable',
                        category: ParameterCategory.CUSTOM
                    };
                }
            }
        }

        params.push({
            key,
            value: decodedValue,
            friendlyName: paramInfo?.friendlyName || key,
            description: paramInfo?.description || 'Unknown parameter.',
            category: paramInfo?.category || ParameterCategory.OTHER,
            isMandatory: paramInfo?.mandatory || false
        });
    });

    params.sort((a, b) => a.category.localeCompare(b.category));

    // GDPR 2026: Geo-IP lookup for data residency tracking
    let dataResidency: DataResidencyInfo | undefined;
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        dataResidency = await lookupDataResidency(domain);
    } catch (error) {
        // If URL parsing fails or lookup fails, skip data residency
        console.warn('[GEO-IP] Skipping data residency for invalid URL');
    }

    return { id, type, rawUrl: url, parameters: params, errors, dataResidency };
};

const detectType = (url: string): BeaconType => {
    const lowercaseUrl = url.toLowerCase();

    // Adobe Analytics
    if (lowercaseUrl.includes('b/ss/') || lowercaseUrl.includes('/ss/') || lowercaseUrl.includes('sc.omtrdc.net')) return BeaconType.ADOBE;

    // GA4 (Enhanced detection for google.com endpoints)
    if (
        lowercaseUrl.includes('google-analytics.com/g/collect') ||
        (lowercaseUrl.includes('google.com/g/collect')) ||
        (lowercaseUrl.includes('/collect') && lowercaseUrl.includes('v=2')) ||
        (lowercaseUrl.includes('google.com/collect') && lowercaseUrl.includes('v=2'))
    ) return BeaconType.GA4;

    // Meta / Facebook
    if (lowercaseUrl.includes('facebook.com/tr') || lowercaseUrl.includes('connect.facebook.net')) return BeaconType.META;

    // TikTok
    if (lowercaseUrl.includes('analytics.tiktok.com')) return BeaconType.TIKTOK;

    return BeaconType.UNKNOWN;
};

const getTypeKey = (type: BeaconType): string => {
    switch (type) {
        case BeaconType.ADOBE: return 'ADOBE';
        case BeaconType.GA4: return 'GA4';
        case BeaconType.META: return 'META';
        case BeaconType.TIKTOK: return 'TIKTOK';
        default: return 'OTHER';
    }
};
