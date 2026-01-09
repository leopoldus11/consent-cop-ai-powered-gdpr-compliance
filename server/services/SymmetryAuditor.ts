/**
 * SymmetryAuditor.ts
 * Analyzes UI element symmetry to detect biased consent interfaces
 * EDPB 2026 Guidelines: "Accept" and "Reject" must have equal visual prominence
 */

import { Page } from 'playwright';
import { SymmetryAuditResult } from '../../types.js';

/**
 * Common selector patterns for Accept/Reject buttons
 * Based on real-world consent banner implementations
 */
const BUTTON_SELECTORS = {
  accept: [
    'button:has-text("Accept")',
    'button:has-text("Accept All")',
    'button:has-text("Allow All")',
    'button:has-text("Agree")',
    'button:has-text("OK")',
    'button:has-text("I Agree")',
    'a:has-text("Accept")',
    '[id*="accept"]',
    '[class*="accept"]',
    '[data-testid*="accept"]',
    '[aria-label*="Accept"]',
  ],
  reject: [
    'button:has-text("Reject")',
    'button:has-text("Reject All")',
    'button:has-text("Deny")',
    'button:has-text("Decline")',
    'button:has-text("No Thanks")',
    'button:has-text("Only Essential")',
    'a:has-text("Reject")',
    '[id*="reject"]',
    '[class*="reject"]',
    '[data-testid*="reject"]',
    '[aria-label*="Reject"]',
  ],
};

/**
 * Find consent buttons using multiple selector strategies
 */
async function findButton(page: Page, selectors: string[]): Promise<any | null> {
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const isVisible = await element.isVisible();
        if (isVisible) return element;
      }
    } catch (error) {
      // Continue to next selector
      continue;
    }
  }
  return null;
}

/**
 * Main Symmetry Audit Function
 * Compares Accept vs Reject button prominence
 */
export async function auditButtonSymmetry(page: Page): Promise<SymmetryAuditResult | null> {
  console.log('[SYMMETRY AUDIT] Starting button symmetry analysis...');

  try {
    // Find Accept button
    const acceptButton = await findButton(page, BUTTON_SELECTORS.accept);
    if (!acceptButton) {
      console.warn('[SYMMETRY AUDIT] Accept button not found');
      return null;
    }

    // Find Reject button
    const rejectButton = await findButton(page, BUTTON_SELECTORS.reject);
    if (!rejectButton) {
      console.warn('[SYMMETRY AUDIT] Reject button not found');
      return null;
    }

    // Get bounding boxes
    const acceptBox = await acceptButton.boundingBox();
    const rejectBox = await rejectButton.boundingBox();

    if (!acceptBox || !rejectBox) {
      console.warn('[SYMMETRY AUDIT] Could not measure button dimensions');
      return null;
    }

    console.log('[SYMMETRY AUDIT] Accept button:', acceptBox);
    console.log('[SYMMETRY AUDIT] Reject button:', rejectBox);

    // Calculate metrics
    const acceptArea = acceptBox.width * acceptBox.height;
    const rejectArea = rejectBox.width * rejectBox.height;
    const sizeRatio = acceptArea / rejectArea;

    // Determine position bias (is Accept on right/prominent position?)
    let positionBias: 'ACCEPT_RIGHT' | 'REJECT_RIGHT' | 'EQUAL' = 'EQUAL';
    if (acceptBox.x > rejectBox.x + 20) {
      positionBias = 'ACCEPT_RIGHT'; // Accept is to the right (Western reading bias)
    } else if (rejectBox.x > acceptBox.x + 20) {
      positionBias = 'REJECT_RIGHT';
    }

    // Calculate overall symmetry score (0-100)
    let score = 100;

    // Penalize size disparity
    if (sizeRatio > 1.5 || sizeRatio < 0.67) {
      score -= 30; // Major size difference
    } else if (sizeRatio > 1.2 || sizeRatio < 0.83) {
      score -= 15; // Minor size difference
    }

    // Penalize position bias (Accept on right = bias)
    if (positionBias === 'ACCEPT_RIGHT') {
      score -= 20;
    }

    // Determine verdict
    let verdict: 'SYMMETRIC' | 'MINOR_BIAS' | 'MAJOR_BIAS';
    if (score >= 80) {
      verdict = 'SYMMETRIC';
    } else if (score >= 60) {
      verdict = 'MINOR_BIAS';
    } else {
      verdict = 'MAJOR_BIAS';
    }

    const result: SymmetryAuditResult = {
      acceptButton: {
        width: acceptBox.width,
        height: acceptBox.height,
        x: acceptBox.x,
        y: acceptBox.y,
      },
      rejectButton: {
        width: rejectBox.width,
        height: rejectBox.height,
        x: rejectBox.x,
        y: rejectBox.y,
      },
      sizeRatio,
      positionBias,
      overallVerdict: verdict,
      score,
    };

    console.log(`[SYMMETRY AUDIT] Verdict: ${verdict} (Score: ${score}/100, Size Ratio: ${sizeRatio.toFixed(2)})`);
    return result;

  } catch (error: any) {
    console.error(`[SYMMETRY AUDIT] Error: ${error.message}`);
    return null;
  }
}

/**
 * Additional: Check if Reject button requires extra clicks (multi-step rejection)
 * EDPB prohibits making rejection harder than acceptance
 */
export async function auditRejectionComplexity(page: Page): Promise<{ 
  multiStepRejection: boolean; 
  steps: number;
  description: string;
}> {
  console.log('[SYMMETRY AUDIT] Checking rejection complexity...');

  try {
    // This is a simplified check: Look for "Manage Preferences" or "Customize" patterns
    const customizeSelectors = [
      'button:has-text("Manage")',
      'button:has-text("Customize")',
      'button:has-text("Preferences")',
      'button:has-text("Settings")',
      'a:has-text("Manage")',
    ];

    let hasManageButton = false;
    for (const selector of customizeSelectors) {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        hasManageButton = true;
        break;
      }
    }

    // If there's a "Manage" button but no direct "Reject All" button, it's multi-step
    const rejectButton = await findButton(page, BUTTON_SELECTORS.reject);
    
    if (hasManageButton && !rejectButton) {
      return {
        multiStepRejection: true,
        steps: 2,
        description: 'User must click "Manage Preferences" before they can reject. This is a dark pattern.',
      };
    }

    return {
      multiStepRejection: false,
      steps: 1,
      description: 'Direct rejection available.',
    };

  } catch (error: any) {
    console.error(`[SYMMETRY AUDIT] Rejection complexity check failed: ${error.message}`);
    return {
      multiStepRejection: false,
      steps: 0,
      description: 'Check failed',
    };
  }
}

