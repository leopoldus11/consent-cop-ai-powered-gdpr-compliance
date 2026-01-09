/**
 * debugLogger.ts
 * 
 * Global DEBUG_MODE toggle for developer verification
 * Outputs structured forensic data to browser console using console.table()
 * 
 * Usage:
 * - Enable: CONSENTINEL_DEBUG.enable() in browser console
 * - Disable: CONSENTINEL_DEBUG.disable() in browser console
 */

export const DEBUG_MODE = {
  enabled: typeof window !== 'undefined' && localStorage.getItem('CONSENTINEL_DEBUG') === 'true',
  
  enable() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('CONSENTINEL_DEBUG', 'true');
      this.enabled = true;
      console.log('%c[CONSENTINEL DEBUG MODE ENABLED]', 'color: #00ff00; font-weight: bold; font-size: 16px; padding: 10px;');
      console.log('%cRun CONSENTINEL_DEBUG.disable() to turn off', 'color: #888; font-style: italic;');
    }
  },
  
  disable() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('CONSENTINEL_DEBUG', 'false');
      this.enabled = false;
      console.log('%c[CONSENTINEL DEBUG MODE DISABLED]', 'color: #ff0000; font-weight: bold;');
    }
  },
  
  logViolations(violations: any[]) {
    if (!this.enabled || !violations || violations.length === 0) return;
    
    console.group('%c📊 VIOLATION AUDIT', 'color: #ff6b6b; font-weight: bold; font-size: 14px;');
    console.log(`Total violations detected: ${violations.length}`);
    console.table(violations.map(v => ({
      'Trace ID': v.traceId || 'N/A',
      'Target Domain': v.targetDomain || 'N/A',
      'Vendor': v.vendorType || 'N/A',
      'Type': v.violationType || 'N/A',
      'Risk': v.riskLevel || 'N/A',
      'Reason': v.explanation || 'N/A'
    })));
    console.groupEnd();
  },
  
  logAccessibility(scores: any) {
    if (!this.enabled || !scores) return;
    
    console.group('%c♿ ACCESSIBILITY SCORES (POUR Framework)', 'color: #4ecdc4; font-weight: bold; font-size: 14px;');
    console.table({
      'Perceivable (Visual)': `${scores.perceivable || 0}%`,
      'Operable (Keyboard)': `${scores.operable || 0}%`,
      'Understandable (Language)': `${scores.understandable || 0}%`,
      'Robust (Assistive Tech)': `${scores.robust || 0}%`
    });
    
    // Calculate overall compliance
    const avg = ((scores.perceivable || 0) + (scores.operable || 0) + (scores.understandable || 0) + (scores.robust || 0)) / 4;
    const status = avg >= 90 ? '✅ PASS' : avg >= 70 ? '⚠️ PARTIAL' : '❌ FAIL';
    console.log(`Overall EAA Compliance: ${status} (${avg.toFixed(1)}%)`);
    console.groupEnd();
  },
  
  logTransparency(result: any) {
    if (!this.enabled || !result) return;
    
    console.group('%c📜 ARTICLE 13 TRANSPARENCY AUDIT', 'color: #ffe66d; font-weight: bold; font-size: 14px;');
    console.table({
      'Article 13 Compliance': result.articleCompliance || 'UNKNOWN',
      'Data Categories Disclosed': result.hasDataCategories ? '✅ YES' : '❌ NO',
      'Third Parties Named': result.hasThirdPartyList ? '✅ YES' : '❌ NO'
    });
    
    if (result.dataCategoriesFound && result.dataCategoriesFound.length > 0) {
      console.log('%cData Categories Found:', 'font-weight: bold;');
      console.log(result.dataCategoriesFound.join(', '));
    } else {
      console.log('%c⚠️ No explicit data categories found in banner', 'color: #ff9800;');
    }
    
    if (result.thirdPartiesFound && result.thirdPartiesFound.length > 0) {
      console.log('%cThird Parties Named:', 'font-weight: bold;');
      console.log(result.thirdPartiesFound.join(', '));
    } else {
      console.log('%c⚠️ No specific third parties named (generic terms used)', 'color: #ff9800;');
    }
    
    console.log('%cEvidence:', 'font-weight: bold;');
    console.log(result.evidence || 'No evidence provided');
    console.groupEnd();
  },
  
  logGDPRAudit(gdprAudit: any) {
    if (!this.enabled || !gdprAudit) return;
    
    console.group('%c🔍 GDPR 2026 AUDIT RESULTS', 'color: #a78bfa; font-weight: bold; font-size: 14px;');
    
    // Parity of Ease
    if (gdprAudit.parity) {
      console.log('%c1. PARITY OF EASE (First-Layer Reject)', 'font-weight: bold; color: #8b5cf6;');
      console.table({
        'First-Layer Reject Visible': gdprAudit.parity.firstLayerRejectVisible ? '✅ YES' : '❌ NO',
        'Button Location': gdprAudit.parity.rejectButtonLocation || 'N/A',
        'Clicks to Reject': gdprAudit.parity.clicksToReject || 'N/A',
        'Verdict': gdprAudit.parity.firstLayerRejectVisible ? 'Compliant' : 'VIOLATION'
      });
    }
    
    // Granularity
    if (gdprAudit.granularity) {
      console.log('%c2. GRANULAR CONSENT', 'font-weight: bold; color: #8b5cf6;');
      console.table({
        'Has Granular Controls': gdprAudit.granularity.hasGranularControls ? 'YES' : 'NO',
        'Pre-Ticked Non-Essential': gdprAudit.granularity.preTickedNonEssential ? '❌ VIOLATION' : '✅ Compliant',
        'Pre-Ticked Count': gdprAudit.granularity.preTickedCount || 0,
        'Severity': gdprAudit.granularity.violationSeverity || 'NONE'
      });
    }
    
    // Data Residency
    console.log('%c3. DATA RESIDENCY', 'font-weight: bold; color: #8b5cf6;');
    if (gdprAudit.dataResidencyViolations && gdprAudit.dataResidencyViolations.length > 0) {
      console.table(gdprAudit.dataResidencyViolations.map((v: any) => ({
        'Domain': v.requestDomain,
        'Country': v.country,
        'Adequacy': v.adequacyStatus
      })));
    } else {
      console.log('✅ No non-adequate country transfers detected');
    }
    
    console.groupEnd();
  },
  
  logScanSummary(result: any) {
    if (!this.enabled || !result) return;
    
    console.group('%c🎯 SCAN SUMMARY', 'color: #10b981; font-weight: bold; font-size: 16px;');
    console.table({
      'URL': result.url || 'N/A',
      'Risk Score': `${result.riskScore || 0}/100`,
      'Total Requests': result.requests?.length || 0,
      'Pre-Consent Violations': result.requestsBeforeConsent?.filter((r: any) => r.status === 'violation').length || 0,
      'CMP Detected': result.bannerProvider || 'None',
      'TMS Detected': result.tmsDetected?.join(', ') || 'None',
      'Scan Duration': result.timestamp ? new Date(result.timestamp).toLocaleString() : 'N/A'
    });
    console.groupEnd();
  }
};

// Expose to window for developer access
if (typeof window !== 'undefined') {
  (window as any).CONSENTINEL_DEBUG = DEBUG_MODE;
  
  // Log initial state
  if (DEBUG_MODE.enabled) {
    console.log('%c[CONSENTINEL DEBUG MODE ACTIVE]', 'color: #00ff00; font-weight: bold; background: #000; padding: 5px;');
  }
}

