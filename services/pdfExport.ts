/**
 * PDF Export Service
 * Generates PDF from scan results
 */

import jsPDF from 'jspdf';
import { ScanResult, AIAnalysis } from '../types';

/**
 * Generate PDF from scan results
 */
export async function generatePDF(
  scanResult: ScanResult,
  aiAnalysis: AIAnalysis | null
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Consent Cop - GDPR Compliance Audit', margin, yPosition);
  yPosition += 10;

  // URL and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`URL: ${scanResult.url}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Date: ${new Date(scanResult.timestamp).toLocaleString()}`, margin, yPosition);
  yPosition += 10;

  // Executive Summary
  if (aiAnalysis) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(aiAnalysis.summary, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPosition);
    yPosition += summaryLines.length * 5 + 5;
  }

  // Risk Score
  checkPageBreak(20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Assessment', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Compliance Score: ${scanResult.complianceScore}/100`, margin, yPosition);
  yPosition += 5;
  doc.text(`Violations Detected: ${scanResult.violationsCount}`, margin, yPosition);
  yPosition += 5;
  
  if (scanResult.fineRange) {
    const fineMin = new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(scanResult.fineRange.min);
    const fineMax = new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(scanResult.fineRange.max);
    doc.text(`Estimated Fine Range: ${fineMin} - ${fineMax}`, margin, yPosition);
    yPosition += 5;
  }
  yPosition += 5;

  // Technology Stack
  checkPageBreak(20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detected Technology Stack', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (scanResult.bannerProvider) {
    doc.text(`CMP: ${scanResult.bannerProvider}`, margin, yPosition);
    yPosition += 5;
  }
  if (scanResult.tmsDetected.length > 0) {
    doc.text(`TMS: ${scanResult.tmsDetected.join(', ')}`, margin, yPosition);
    yPosition += 5;
  }
  if (scanResult.dataLayers.length > 0) {
    doc.text(`Data Layers: ${scanResult.dataLayers.join(', ')}`, margin, yPosition);
    yPosition += 5;
  }
  yPosition += 5;

  // Violations
  const violations = scanResult.requests.filter(r => r.status === 'violation');
  if (violations.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Pre-Consent Violations', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    violations.slice(0, 20).forEach((violation, index) => {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${violation.domain}`, margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      const urlLines = doc.splitTextToSize(violation.url, pageWidth - 2 * margin);
      doc.text(urlLines, margin + 5, yPosition);
      yPosition += urlLines.length * 4;
      if (violation.dataTypes.length > 0) {
        doc.text(`Data Types: ${violation.dataTypes.join(', ')}`, margin + 5, yPosition);
        yPosition += 5;
      }
      yPosition += 3;
    });
  }

  // Remediation Steps
  if (aiAnalysis && aiAnalysis.remediationSteps.length > 0) {
    checkPageBreak(30);
    doc.addPage();
    yPosition = margin;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommended Remediation Steps', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    aiAnalysis.remediationSteps.forEach((step, index) => {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${step.title}`, margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(step.description, pageWidth - 2 * margin);
      doc.text(descLines, margin + 5, yPosition);
      yPosition += descLines.length * 5 + 3;
    });
  }

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Consent Cop - AI-Powered GDPR Compliance Testing | Page ${i} of ${pageCount}`,
      margin,
      pageHeight - 10
    );
    doc.text(
      'This report is generated by AI and does not constitute formal legal advice.',
      margin,
      pageHeight - 5
    );
  }

  // Download
  const fileName = `consent-cop-audit-${scanResult.url.replace(/https?:\/\//, '').replace(/\//g, '-')}-${Date.now()}.pdf`;
  doc.save(fileName);
}


