
import { ParameterCategory } from '../../types';

interface ParamMetadata {
    friendlyName: string;
    description: string;
    category: ParameterCategory;
    mandatory?: boolean;
}

export const PARAM_MAP: Record<string, Record<string, ParamMetadata>> = {
    ADOBE: {
        'mid': { friendlyName: 'Experience Cloud ID (ECID)', description: 'Primary visitor ID for Adobe Experience Cloud.', category: ParameterCategory.CORE, mandatory: true },
        'aid': { friendlyName: 'Legacy Analytics ID', description: 'The old s_vi cookie identifier.', category: ParameterCategory.CORE },
        'vid': { friendlyName: 'Visitor ID', description: 'Custom set visitor ID.', category: ParameterCategory.CORE },
        'pageName': { friendlyName: 'Page Name', description: 'The friendly name of the page.', category: ParameterCategory.CORE },
        'g': { friendlyName: 'Current URL', description: 'The URL of the current page.', category: ParameterCategory.CORE },
        'r': { friendlyName: 'Referrer URL', description: 'The URL of the previous page.', category: ParameterCategory.TRAFFIC },
        'ch': { friendlyName: 'Channel', description: 'Site section or category.', category: ParameterCategory.TRAFFIC },
        'v0': { friendlyName: 'Campaign (eVar0)', description: 'Marketing tracking code.', category: ParameterCategory.TRAFFIC },
        'products': { friendlyName: 'Products String', description: 'Product, Category, Quantity, Price, Events, eVars.', category: ParameterCategory.ECOMMERCE },
        'events': { friendlyName: 'Success Events', description: 'Comma-separated list of analytics events.', category: ParameterCategory.CORE },
        'pe': { friendlyName: 'Link Type', description: 'd (download), e (exit), or o (other).', category: ParameterCategory.CORE },
        'cc': { friendlyName: 'Currency Code', description: 'Currency for transaction data.', category: ParameterCategory.ECOMMERCE },
        'server': { friendlyName: 'Server', description: 'Web server that served the page.', category: ParameterCategory.SYSTEM },
        'zip': { friendlyName: 'Zip Code', description: 'User geographic data.', category: ParameterCategory.USER },
    },
    GA4: {
        'v': { friendlyName: 'Protocol Version', description: 'Must be 2 for Google Analytics 4.', category: ParameterCategory.SYSTEM, mandatory: true },
        'tid': { friendlyName: 'Measurement ID', description: 'The G-XXXXXXXX ID for this stream.', category: ParameterCategory.CORE, mandatory: true },
        'en': { friendlyName: 'Event Name', description: 'Action being measured (e.g., page_view).', category: ParameterCategory.CORE, mandatory: true },
        'cid': { friendlyName: 'Client ID', description: 'Unique browser identifier.', category: ParameterCategory.CORE },
        'sid': { friendlyName: 'Session ID', description: 'Unique session identifier.', category: ParameterCategory.USER },
        'sct': { friendlyName: 'Session Count', description: 'Number of sessions for this user.', category: ParameterCategory.USER },
        'dl': { friendlyName: 'Document Location', description: 'The full URL of the page.', category: ParameterCategory.CORE },
        'dr': { friendlyName: 'Document Referrer', description: 'Source URL.', category: ParameterCategory.TRAFFIC },
        'uid': { friendlyName: 'User ID', description: 'Known user identifier.', category: ParameterCategory.USER },
    },
    META: {
        'id': { friendlyName: 'Pixel ID', description: 'Unique Facebook Pixel ID.', category: ParameterCategory.CORE, mandatory: true },
        'ev': { friendlyName: 'Event Name', description: 'The standard or custom event name.', category: ParameterCategory.CORE, mandatory: true },
        'dl': { friendlyName: 'Document Location', description: 'The page URL.', category: ParameterCategory.CORE },
        'cd[value]': { friendlyName: 'Conversion Value', description: 'Monetary value of the event.', category: ParameterCategory.ECOMMERCE },
        'cd[currency]': { friendlyName: 'Currency', description: 'Currency for value.', category: ParameterCategory.ECOMMERCE },
        'cd[content_name]': { friendlyName: 'Content Name', description: 'Name of the page or product.', category: ParameterCategory.ECOMMERCE },
        'cd[content_type]': { friendlyName: 'Content Type', description: 'Product or product_group.', category: ParameterCategory.ECOMMERCE },
        'cd[content_ids]': { friendlyName: 'Content IDs', description: 'List of product SKUs.', category: ParameterCategory.ECOMMERCE },
        'ud': { friendlyName: 'Hashed User Data', description: 'PII data sent via Advanced Matching.', category: ParameterCategory.USER },
    },
    TIKTOK: {
        'pixel_id': { friendlyName: 'Pixel ID', description: 'TikTok Pixel identifier.', category: ParameterCategory.CORE, mandatory: true },
        'event': { friendlyName: 'Event Name', description: 'Name of the TikTok event.', category: ParameterCategory.CORE },
    }
};
