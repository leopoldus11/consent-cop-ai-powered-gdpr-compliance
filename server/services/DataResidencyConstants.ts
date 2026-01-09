/**
 * DataResidencyConstants.ts
 * GDPR Article 44-49: Cross-border data transfer regulations
 * 
 * EEA Countries: Data transfers within EEA are unrestricted
 * Adequate Countries: EU Commission has determined adequate data protection
 * Non-Adequate: Requires Standard Contractual Clauses (SCCs) or other safeguards
 */

/**
 * European Economic Area (EEA) Countries
 * Data transfers within these countries are GDPR-compliant by default
 */
export const EEA_COUNTRIES = [
  // EU Member States (27)
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
  
  // EEA Non-EU Members (3)
  'IS', // Iceland
  'LI', // Liechtenstein
  'NO', // Norway
];

/**
 * Countries with EU Adequacy Decisions
 * EU Commission has determined these countries provide adequate data protection
 * Source: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en
 * Last updated: 2026
 */
export const ADEQUATE_COUNTRIES = [
  'AD', // Andorra
  'AR', // Argentina
  'CA', // Canada (commercial organizations)
  'FO', // Faroe Islands
  'GG', // Guernsey
  'IL', // Israel
  'IM', // Isle of Man
  'JP', // Japan
  'JE', // Jersey
  'NZ', // New Zealand
  'KR', // South Korea
  'CH', // Switzerland
  'GB', // United Kingdom (post-Brexit adequacy)
  'UY', // Uruguay
];

/**
 * Check if a country code is within the EEA
 */
export function isEEACountry(countryCode: string): boolean {
  return EEA_COUNTRIES.includes(countryCode.toUpperCase());
}

/**
 * Check if a country has an adequacy decision
 */
export function isAdequateCountry(countryCode: string): boolean {
  return ADEQUATE_COUNTRIES.includes(countryCode.toUpperCase());
}

/**
 * Determine adequacy status for GDPR compliance
 */
export function getAdequacyStatus(countryCode: string): 'EEA' | 'ADEQUATE' | 'NON_ADEQUATE' | 'UNKNOWN' {
  if (!countryCode) return 'UNKNOWN';
  
  const code = countryCode.toUpperCase();
  
  if (isEEACountry(code)) return 'EEA';
  if (isAdequateCountry(code)) return 'ADEQUATE';
  return 'NON_ADEQUATE';
}

/**
 * High-risk countries for data protection (no adequacy decision)
 * These require explicit safeguards under GDPR
 */
export const HIGH_RISK_COUNTRIES = [
  'US', // United States (no adequacy post-Schrems II, requires DPF)
  'CN', // China
  'RU', // Russia
  'IN', // India
  'BR', // Brazil (has LGPD but no EU adequacy)
  'SG', // Singapore
  'AU', // Australia
];

/**
 * Check if data transfer to this country requires additional scrutiny
 */
export function isHighRiskTransfer(countryCode: string): boolean {
  return HIGH_RISK_COUNTRIES.includes(countryCode.toUpperCase());
}

