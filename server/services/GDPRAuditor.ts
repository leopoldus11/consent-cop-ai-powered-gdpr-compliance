/**
 * GDPRAuditor.ts
 * Comprehensive GDPR 2026 Compliance Audit Module
 * 
 * Audits:
 * 1. Parity of Ease (First-Layer Reject) - EDPB Guidelines 05/2020
 * 2. Granularity (Toggle Analysis) - Article 7 GDPR
 * 3. Accessibility (WCAG 2.2 + EAA) - European Accessibility Act
 */

import { Page, ElementHandle } from 'playwright';
import {
  ParityOfEaseResult,
  GranularityResult,
  ToggleInfo,
  AccessibilityResult
} from '../../types.js';
import { jitteredDelay } from '../antiBotUtils.js';

/**
 * ============================================
 * 1. PARITY OF EASE AUDITOR
 * ============================================
 * EDPB Guidelines 05/2020: "Reject All" must be as easy as "Accept All"
 * First-layer visibility is mandatory (no extra clicks required)
 */

const REJECT_SELECTORS = [
  // ============================================
  // USERCENTRICS SPECIFIC SELECTORS (Shadow DOM)
  // ============================================
  // Usercentrics uses data-testid attributes
  '[data-testid="uc-deny-all-button"]',
  '[data-testid="uc-decline-button"]',
  'button[data-testid*="deny"]',
  'button[data-testid*="decline"]',
  
  // Usercentrics German implementation
  'button:has-text("Alles ablehnen")', // Usercentrics standard German
  'button:has-text("Nur Notwendige")', // "Only necessary" = reject
  'button:has-text("Nur erforderliche")',
  
  // ============================================
  // ONETRUST SPECIFIC SELECTORS
  // ============================================
  '#onetrust-reject-all-handler',
  '.onetrust-close-btn-handler',
  'button.ot-pc-refuse-all-handler',
  
  // ============================================
  // COOKIEBOT SPECIFIC SELECTORS
  // ============================================
  '#CybotCookiebotDialogBodyButtonDecline',
  'a#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll',
  
  // ============================================
  // STANDARD SELECTORS (Multi-language)
  // ============================================
  // English
  'button:has-text("Reject All")',
  'button:has-text("Reject all")',
  'button:has-text("Refuse All")',
  'button:has-text("Refuse")',
  'button:has-text("Decline All")',
  'button:has-text("Deny All")',
  'button:has-text("Deny")',
  'a:has-text("Reject All")',
  
  // German
  'button:has-text("Alle ablehnen")',
  'button:has-text("Ablehnen")',
  'button:has-text("Alle zurückweisen")',
  
  // French
  'button:has-text("Tout refuser")',
  'button:has-text("Refuser")',
  'button:has-text("Refuser tout")',
  'button:has-text("Continuer sans accepter")', // Continue without accepting
  
  // Spanish
  'button:has-text("Rechazar todo")',
  'button:has-text("Rechazar")',
  
  // Italian
  'button:has-text("Rifiuta tutto")',
  'button:has-text("Rifiuta")',
  
  // Dutch
  'button:has-text("Alles weigeren")',
  'button:has-text("Weigeren")',
  
  // Generic patterns
  '[aria-label*="reject" i]',
  '[aria-label*="refuse" i]',
  '[aria-label*="decline" i]',
  '[aria-label*="deny" i]',
  '[aria-label*="ablehnen" i]',
  '[data-testid*="reject"]',
  '[data-testid*="deny"]',
  '[id*="reject"]',
  '[class*="reject"]',
  '[class*="deny"]'
];

const OPTIONS_SELECTORS = [
  // ============================================
  // USERCENTRICS SPECIFIC
  // ============================================
  '[data-testid="uc-more-button"]',
  '[data-testid="uc-customize-button"]',
  'button:has-text("Mehr Informationen")', // German Usercentrics
  'button:has-text("Cookie-Einstellungen")',
  'button:has-text("Cookies verwalten")',
  
  // ============================================
  // ONETRUST SPECIFIC
  // ============================================
  '#onetrust-pc-btn-handler',
  '.ot-sdk-show-settings',
  
  // ============================================
  // COOKIEBOT SPECIFIC
  // ============================================
  '#CybotCookiebotDialogBodyLevelButtonCustomize',
  'a#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection',
  
  // ============================================
  // STANDARD SELECTORS
  // ============================================
  'button:has-text("Manage")',
  'button:has-text("Settings")',
  'button:has-text("Customize")',
  'button:has-text("Preferences")',
  'button:has-text("Options")',
  'button:has-text("More options")',
  'button:has-text("Einstellungen")', // German
  'button:has-text("Préférences")', // French
  'button:has-text("Preferencias")', // Spanish
  'button:has-text("Impostazioni")', // Italian
  'a:has-text("Manage")',
  '[aria-label*="manage" i]',
  '[aria-label*="settings" i]',
  '[aria-label*="einstellungen" i]',
  '[data-testid*="manage"]',
  '[data-testid*="settings"]',
  '[data-testid*="more"]'
];

/**
 * Enhanced button finder that searches:
 * 1. Main document
 * 2. Shadow DOM elements (Usercentrics, OneTrust)
 * 3. Iframes (some CMPs use iframes)
 */
async function findButton(page: Page, selectors: string[]): Promise<ElementHandle | null> {
  // Try standard selectors first
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        console.log(`[GDPR BUTTON] Found via standard selector: ${selector}`);
        return element;
      }
    } catch (error) {
      continue;
    }
  }

  // Try shadow DOM piercing (>>> selector in Playwright)
  for (const selector of selectors) {
    try {
      // Usercentrics shadow host
      const shadowSelector = `#usercentrics-root >>> ${selector}`;
      const element = await page.$(shadowSelector);
      if (element && await element.isVisible()) {
        console.log(`[GDPR BUTTON] Found in Usercentrics shadow DOM: ${selector}`);
        return element;
      }
    } catch (error) {
      continue;
    }
  }

  // Try text-based fallback search using page.evaluate
  try {
    const buttonTexts = [
      'Alles ablehnen', 'Alle ablehnen', 'Ablehnen', 'Nur Notwendige',
      'Reject All', 'Deny All', 'Decline All', 'Refuse',
      'Tout refuser', 'Rechazar todo', 'Rifiuta tutto'
    ];
    
    const buttonHandle = await page.evaluateHandle((texts) => {
      // Search in all shadow roots
      const searchInShadow = (root: Document | ShadowRoot): HTMLElement | null => {
        for (const text of texts) {
          const buttons = root.querySelectorAll('button, a, [role="button"]');
          for (const btn of buttons) {
            const btnText = (btn as HTMLElement).innerText || btn.textContent || '';
            if (btnText.toLowerCase().includes(text.toLowerCase())) {
              const el = btn as HTMLElement;
              if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                return el;
              }
            }
          }
        }
        
        // Recursively search shadow roots
        const shadowHosts = root.querySelectorAll('*');
        for (const host of shadowHosts) {
          if ((host as any).shadowRoot) {
            const found = searchInShadow((host as any).shadowRoot);
            if (found) return found;
          }
        }
        return null;
      };
      
      return searchInShadow(document);
    }, buttonTexts);
    
    if (buttonHandle) {
      const element = buttonHandle.asElement();
      if (element && await element.isVisible()) {
        console.log(`[GDPR BUTTON] Found via deep shadow DOM text search`);
        return element;
      }
    }
  } catch (error) {
    console.warn(`[GDPR BUTTON] Shadow DOM text search failed: ${(error as Error).message}`);
  }

  return null;
}

/**
 * Enhanced accept button finder with CMP-specific selectors
 */
async function findAcceptButton(page: Page): Promise<ElementHandle | null> {
  const acceptSelectors = [
    // Usercentrics
    '[data-testid="uc-accept-all-button"]',
    'button[data-testid*="accept"]',
    
    // OneTrust
    '#onetrust-accept-btn-handler',
    
    // Cookiebot
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    
    // Standard
    'button:has-text("Accept All")',
    'button:has-text("Accept all")',
    'button:has-text("Agree")',
    'button:has-text("Allow all")',
    'button:has-text("Alle akzeptieren")', // German
    'button:has-text("Akzeptieren")',
    'button:has-text("Tout accepter")', // French
    'button:has-text("Accepter")',
    '[aria-label*="accept" i]',
    '[aria-label*="akzeptieren" i]'
  ];
  
  return findButton(page, acceptSelectors);
}

export async function auditParity(page: Page): Promise<ParityOfEaseResult> {
  console.log('[GDPR PARITY] Starting First-Layer Reject audit...');

  try {
    // Wait for banner to stabilize
    await jitteredDelay(1000, 0.2);

    // Step 1: Look for Reject button on first layer
    const rejectButton = await findButton(page, REJECT_SELECTORS);

    if (rejectButton) {
      const buttonText = await rejectButton.evaluate(el => el.textContent?.trim() || '');
      console.log(`[GDPR PARITY] ✅ First-layer Reject found: "${buttonText}"`);

      return {
        firstLayerRejectVisible: true,
        rejectButtonLocation: 'FIRST_LAYER',
        rejectButtonText: buttonText,
        requiresExtraClicks: false,
        clicksToReject: 1,
        evidence: `Compliant: "Reject All" button visible on first layer ("${buttonText}")`
      };
    }

    // Step 2: No reject button found - check if options/settings exists
    console.warn('[GDPR PARITY] ⚠️  No first-layer Reject button found');
    const optionsButton = await findButton(page, OPTIONS_SELECTORS);

    if (optionsButton) {
      const optionsText = await optionsButton.evaluate(el => el.textContent?.trim() || '');
      console.log(`[GDPR PARITY] Found options button: "${optionsText}"`);

      return {
        firstLayerRejectVisible: false,
        rejectButtonLocation: 'SECOND_LAYER',
        requiresExtraClicks: true,
        clicksToReject: 2,
        evidence: `VIOLATION: No "Reject All" on first layer. User must click "${optionsText}" first (EDPB Guidelines 05/2020 violation)`
      };
    }

    // Step 3: Neither reject nor options found
    console.error('[GDPR PARITY] ❌ No Reject or Options button found');
    return {
      firstLayerRejectVisible: false,
      rejectButtonLocation: 'NOT_FOUND',
      requiresExtraClicks: true,
      clicksToReject: 0,
      evidence: 'CRITICAL VIOLATION: No rejection mechanism detected (Article 7 GDPR)'
    };

  } catch (error: any) {
    console.error(`[GDPR PARITY] Error: ${error.message}`);
    return {
      firstLayerRejectVisible: false,
      rejectButtonLocation: 'NOT_FOUND',
      requiresExtraClicks: true,
      clicksToReject: 0,
      evidence: `Audit failed: ${error.message}`
    };
  }
}

/**
 * ============================================
 * 2. GRANULARITY AUDITOR
 * ============================================
 * Article 7 GDPR: Consent must be granular and freely given
 * Pre-ticked boxes for non-essential purposes are prohibited
 */

const CATEGORY_KEYWORDS = {
  NECESSARY: [
    'necessary', 'essential', 'required', 'strictly', 'technical', 'functional',
    'erforderlich', 'notwendig', 'obligatoire', 'nécessaire', 'necesario'
  ],
  ANALYTICS: [
    'analytics', 'statistics', 'performance', 'measurement', 'tracking',
    'analyse', 'statistik', 'statistiques', 'analítica', 'estadísticas'
  ],
  MARKETING: [
    'marketing', 'advertising', 'ads', 'targeting', 'promotional',
    'werbung', 'publicité', 'publicidad', 'anuncios'
  ],
  PERSONALIZATION: [
    'personalization', 'personalization', 'preferences', 'customization',
    'personnalisation', 'personalización'
  ]
};

function categorizeToggle(label: string): 'NECESSARY' | 'ANALYTICS' | 'MARKETING' | 'PERSONALIZATION' | 'UNKNOWN' {
  const lowerLabel = label.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerLabel.includes(keyword))) {
      return category as any;
    }
  }

  return 'UNKNOWN';
}

export async function auditGranularity(page: Page): Promise<GranularityResult> {
  console.log('[GDPR GRANULARITY] Starting toggle analysis...');

  try {
    // Step 1: Find and click "Manage Preferences" button
    const optionsButton = await findButton(page, OPTIONS_SELECTORS);

    if (!optionsButton) {
      console.warn('[GDPR GRANULARITY] No settings button found');
      return {
        hasGranularControls: false,
        toggles: [],
        preTickedNonEssential: false,
        preTickedCount: 0,
        violationSeverity: 'NONE',
        evidence: 'No granular controls detected (may not be required for simple sites)'
      };
    }

    // Click options button using standard Playwright click (more reliable)
    console.log('[GDPR GRANULARITY] Clicking settings button...');
    try {
      await optionsButton.click({ force: true, timeout: 5000 });
    } catch (clickError) {
      console.warn('[GDPR GRANULARITY] Standard click failed, trying JS click...');
      await optionsButton.evaluate((el) => (el as HTMLElement).click());
    }
    await jitteredDelay(2000, 0.3); // Wait for preferences panel to render

    // Step 2: Find all toggles
    const toggles = await page.$$('input[type="checkbox"], [role="switch"]');
    console.log(`[GDPR GRANULARITY] Found ${toggles.length} toggle elements`);

    if (toggles.length === 0) {
      return {
        hasGranularControls: false,
        toggles: [],
        preTickedNonEssential: false,
        preTickedCount: 0,
        violationSeverity: 'MINOR',
        evidence: 'Settings panel found but no granular toggles detected'
      };
    }

    // Step 3: Analyze each toggle
    const toggleInfos: ToggleInfo[] = [];
    let preTickedNonEssential = false;
    let preTickedCount = 0;

    for (const toggle of toggles) {
      try {
        // Get toggle state
        const isChecked = await toggle.isChecked();
        const isDisabled = await toggle.isDisabled();

        // Find associated label
        const label = await toggle.evaluate((el) => {
          // Try aria-label
          const ariaLabel = el.getAttribute('aria-label');
          if (ariaLabel) return ariaLabel;

          // Try label element
          const id = el.getAttribute('id');
          if (id) {
            const labelEl = document.querySelector(`label[for="${id}"]`);
            if (labelEl) return labelEl.textContent?.trim() || '';
          }

          // Try parent label
          const parentLabel = el.closest('label');
          if (parentLabel) return parentLabel.textContent?.trim() || '';

          // Try nearby text
          const parent = el.parentElement;
          if (parent) return parent.textContent?.trim() || '';

          return 'Unknown';
        });

        const category = categorizeToggle(label);

        toggleInfos.push({
          label,
          category,
          isPreTicked: isChecked,
          isDisabled
        });

        // Check for GDPR violation: pre-ticked non-essential toggles
        if (isChecked && category !== 'NECESSARY' && !isDisabled) {
          preTickedNonEssential = true;
          preTickedCount++;
          console.warn(`[GDPR GRANULARITY] ⚠️  Pre-ticked non-essential: "${label}" (${category})`);
        }

      } catch (err) {
        console.error('[GDPR GRANULARITY] Error analyzing toggle:', err);
      }
    }

    // Determine severity
    let severity: 'NONE' | 'MINOR' | 'MAJOR' = 'NONE';
    if (preTickedNonEssential) {
      severity = preTickedCount > 2 ? 'MAJOR' : 'MINOR';
    }

    const result: GranularityResult = {
      hasGranularControls: true,
      toggles: toggleInfos,
      preTickedNonEssential,
      preTickedCount,
      violationSeverity: severity,
      evidence: preTickedNonEssential
        ? `VIOLATION: ${preTickedCount} non-essential toggle(s) are pre-ticked (Article 7 GDPR - consent not freely given)`
        : 'Compliant: Granular controls present, no pre-ticked non-essential purposes'
    };

    console.log(`[GDPR GRANULARITY] Analysis complete: ${severity} severity`);
    return result;

  } catch (error: any) {
    console.error(`[GDPR GRANULARITY] Error: ${error.message}`);
    return {
      hasGranularControls: false,
      toggles: [],
      preTickedNonEssential: false,
      preTickedCount: 0,
      violationSeverity: 'NONE',
      evidence: `Audit failed: ${error.message}`
    };
  }
}

/**
 * ============================================
 * 3. ACCESSIBILITY AUDITOR
 * ============================================
 * European Accessibility Act (EAA) 2025 + WCAG 2.2 AA
 */

function calculateContrastRatio(color1: string, color2: string): number {
  // Parse RGB color strings (e.g., "rgb(255, 255, 255)")
  const parseRGB = (colorStr: string): number[] => {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return [0, 0, 0];
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  };

  const rgb1 = parseRGB(color1);
  const rgb2 = parseRGB(color2);

  // Calculate relative luminance (WCAG formula)
  const getLuminance = (rgb: number[]): number => {
    const [r, g, b] = rgb.map(val => {
      const normalized = val / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

async function checkColorContrast(element: ElementHandle): Promise<{ ratio: number; passes: boolean }> {
  try {
    const styles = await element.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor
      };
    });

    const ratio = calculateContrastRatio(styles.color, styles.backgroundColor);
    const passes = ratio >= 4.5; // WCAG AA standard for normal text

    return { ratio, passes };
  } catch (error) {
    return { ratio: 0, passes: false };
  }
}

async function checkAriaLabels(button: ElementHandle): Promise<{ hasLabel: boolean; label?: string }> {
  try {
    const ariaInfo = await button.evaluate((el) => ({
      ariaLabel: el.getAttribute('aria-label'),
      ariaLabelledBy: el.getAttribute('aria-labelledby'),
      role: el.getAttribute('role'),
      innerText: (el as HTMLElement).innerText
    }));

    const hasLabel = !!(ariaInfo.ariaLabel || ariaInfo.ariaLabelledBy || ariaInfo.innerText);
    const label = ariaInfo.ariaLabel || ariaInfo.innerText || undefined;

    return { hasLabel, label };
  } catch (error) {
    return { hasLabel: false };
  }
}

export async function auditAccessibility(page: Page): Promise<AccessibilityResult> {
  console.log('[GDPR ACCESSIBILITY] Starting WCAG 2.2 compliance check...');

  const violations: string[] = [];

  try {
    // Find Accept and Reject buttons using enhanced finders
    const acceptButton = await findAcceptButton(page);
    const rejectButton = await findButton(page, REJECT_SELECTORS);

    console.log(`[GDPR ACCESSIBILITY] Accept button found: ${!!acceptButton}`);
    console.log(`[GDPR ACCESSIBILITY] Reject button found: ${!!rejectButton}`);

    // If we can't find buttons, provide detailed diagnostics
    if (!acceptButton && !rejectButton) {
      console.warn('[GDPR ACCESSIBILITY] Neither accept nor reject buttons found');
      return {
        wcag22Compliant: false,
        contrastChecks: {
          acceptButton: { ratio: 0, passes: false },
          rejectButton: { ratio: 0, passes: false }
        },
        ariaLabels: {
          acceptButton: { hasLabel: false },
          rejectButton: { hasLabel: false }
        },
        keyboardNavigable: false,
        violations: ['Buttons not found for accessibility audit'],
        score: 0,
        pourScores: {
          perceivable: 0,
          operable: 0,
          understandable: 0,
          robust: 0
        }
      };
    }

    // If only one button found, still proceed with partial audit
    if (!acceptButton || !rejectButton) {
      const missingButton = !acceptButton ? 'Accept' : 'Reject';
      violations.push(`${missingButton} button not found for full accessibility audit`);
    }

    // Check color contrast (with null safety)
    const acceptContrast = acceptButton 
      ? await checkColorContrast(acceptButton) 
      : { ratio: 0, passes: false };
    const rejectContrast = rejectButton 
      ? await checkColorContrast(rejectButton) 
      : { ratio: 0, passes: false };

    if (acceptButton) {
      console.log(`[GDPR ACCESSIBILITY] Accept button contrast: ${acceptContrast.ratio.toFixed(2)}:1`);
      if (!acceptContrast.passes) {
        violations.push(`Accept button fails WCAG contrast (${acceptContrast.ratio.toFixed(2)}:1 < 4.5:1)`);
      }
    }
    
    if (rejectButton) {
      console.log(`[GDPR ACCESSIBILITY] Reject button contrast: ${rejectContrast.ratio.toFixed(2)}:1`);
      if (!rejectContrast.passes) {
        violations.push(`Reject button fails WCAG contrast (${rejectContrast.ratio.toFixed(2)}:1 < 4.5:1)`);
      }
    }

    // Check ARIA labels (with null safety)
    const acceptAria = acceptButton 
      ? await checkAriaLabels(acceptButton) 
      : { hasLabel: false };
    const rejectAria = rejectButton 
      ? await checkAriaLabels(rejectButton) 
      : { hasLabel: false };

    if (acceptButton) {
      console.log(`[GDPR ACCESSIBILITY] Accept button ARIA: ${acceptAria.hasLabel ? '✅' : '❌'}`);
      if (!acceptAria.hasLabel) {
        violations.push('Accept button missing accessible label');
      }
    }
    
    if (rejectButton) {
      console.log(`[GDPR ACCESSIBILITY] Reject button ARIA: ${rejectAria.hasLabel ? '✅' : '❌'}`);
      if (!rejectAria.hasLabel) {
        violations.push('Reject button missing accessible label');
      }
    }

    // Check keyboard navigation (Shadow DOM aware)
    let keyboardNavigable = false;
    try {
      await page.keyboard.press('Tab');
      await jitteredDelay(200, 0.1);
      
      // Shadow-DOM-aware focus detection
      // The standard document.activeElement fails in Shadow DOM because it only shows the shadow host,
      // not the actual focused element inside. We need to recursively pierce shadow roots.
      const focusedElement = await page.evaluate(() => {
        let active = document.activeElement;
        // Recursively pierce shadow roots to find the actual focused element
        while (active?.shadowRoot?.activeElement) {
          active = active.shadowRoot.activeElement;
        }
        return active?.tagName?.toLowerCase() || null;
      });
      
      keyboardNavigable = focusedElement === 'button' || focusedElement === 'a' || focusedElement === 'input';
      console.log(`[GDPR ACCESSIBILITY] Keyboard navigation (shadow-aware): ${keyboardNavigable ? '✅' : '❌'} (focused: ${focusedElement})`);

      if (!keyboardNavigable) {
        violations.push('Consent buttons not keyboard-accessible');
      }
    } catch (error) {
      console.warn('[GDPR ACCESSIBILITY] Keyboard nav check failed:', error);
    }

    // Calculate overall score (0-100)
    let score = 100;
    if (!acceptContrast.passes) score -= 25;
    if (!rejectContrast.passes) score -= 25;
    if (!acceptAria.hasLabel) score -= 15;
    if (!rejectAria.hasLabel) score -= 15;
    if (!keyboardNavigable) score -= 20;

    // Calculate POUR scores (EAA 2025/2026)
    // Perceivable: Color contrast + visual indicators
    let perceivableScore = 100;
    if (!acceptContrast.passes) perceivableScore -= 50;
    if (!rejectContrast.passes) perceivableScore -= 50;
    
    // Operable: Keyboard navigation + interaction
    let operableScore = 100;
    if (!keyboardNavigable) operableScore -= 100;
    
    // Understandable: Labels and language
    let understandableScore = 100;
    if (!acceptAria.hasLabel) understandableScore -= 50;
    if (!rejectAria.hasLabel) understandableScore -= 50;
    
    // Robust: ARIA and HTML validity
    let robustScore = 100;
    if (!acceptAria.hasLabel && !rejectAria.hasLabel) robustScore -= 100;
    else if (!acceptAria.hasLabel || !rejectAria.hasLabel) robustScore -= 50;

    const wcag22Compliant = violations.length === 0;

    const result: AccessibilityResult = {
      wcag22Compliant,
      contrastChecks: {
        acceptButton: acceptContrast,
        rejectButton: rejectContrast
      },
      ariaLabels: {
        acceptButton: acceptAria,
        rejectButton: rejectAria
      },
      keyboardNavigable,
      violations,
      score: Math.max(0, score),
      pourScores: {
        perceivable: Math.max(0, perceivableScore),
        operable: Math.max(0, operableScore),
        understandable: Math.max(0, understandableScore),
        robust: Math.max(0, robustScore)
      }
    };

    console.log(`[GDPR ACCESSIBILITY] Compliance: ${wcag22Compliant ? '✅ PASS' : '❌ FAIL'} (Score: ${result.score}/100)`);
    console.log(`[GDPR ACCESSIBILITY] POUR Scores: P=${result.pourScores.perceivable} O=${result.pourScores.operable} U=${result.pourScores.understandable} R=${result.pourScores.robust}`);
    return result;

  } catch (error: any) {
    console.error(`[GDPR ACCESSIBILITY] Error: ${error.message}`);
    return {
      wcag22Compliant: false,
      contrastChecks: {
        acceptButton: { ratio: 0, passes: false },
        rejectButton: { ratio: 0, passes: false }
      },
      ariaLabels: {
        acceptButton: { hasLabel: false },
        rejectButton: { hasLabel: false }
      },
      keyboardNavigable: false,
      violations: [`Audit failed: ${error.message}`],
      score: 0
    };
  }
}

