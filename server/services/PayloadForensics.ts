
import { BeaconType, ParsedBeacon, ParameterInfo, ParameterCategory } from '../../types';
import { PARAM_MAP } from './ForensicConstants';

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

export const parseBeaconUrl = (url: string, id: string): ParsedBeacon => {
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

    return { id, type, rawUrl: url, parameters: params, errors };
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
