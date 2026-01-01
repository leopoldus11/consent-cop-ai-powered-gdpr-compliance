
import React from 'react';
import { ScanResult } from '../types';

interface RiskAssessmentProps {
  result: ScanResult;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({ result }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50 border-red-100';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-green-600 bg-green-50 border-green-100';
  };

  const getScoreLetter = (score: number) => {
    if (score >= 90) return 'F';
    if (score >= 70) return 'D';
    if (score >= 50) return 'C';
    if (score >= 30) return 'B';
    return 'A';
  };

  // Use fineRange from scan result if available, otherwise calculate
  const fineRange = result.fineRange || { min: 0, max: 0 };
  const formattedFineMin = new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(fineRange.min);
  const formattedFineMax = new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(fineRange.max);

  return (
    <aside className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4">
          <svg className="w-8 h-8 text-slate-50" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 011.512-.306c.736.06 1.39.321 1.964.734.57.412 1.053.955 1.452 1.573.4.617.72 1.312.923 2.062.203.75.286 1.545.215 2.333-.067.74-.236 1.442-.486 2.083-.245.631-.564 1.2-.95 1.685-.386.486-.838.892-1.34 1.205-.5.312-1.043.528-1.618.647a6.974 6.974 0 01-1.42.04c-.45-.035-.885-.125-1.297-.26a6.38 6.38 0 01-1.204-.52 7.042 7.042 0 01-1.05-.722c-.32-.266-.613-.568-.87-.9-.25-.33-.464-.7-.63-1.09-.164-.384-.28-.79-.344-1.21-.06-.418-.08-.85-.046-1.285.035-.45.123-.888.257-1.31a6.452 6.452 0 01.527-1.22 7.152 7.152 0 01.737-1.076c.27-.327.576-.63.91-.9a1 1 0 00.32-1.242l-1.447-3.254a1 1 0 00-1.127-.585 9.94 9.94 0 00-4.6 2.44 1 1 0 00-.23 1.28l1.448 3.255a1 1 0 001.242.32 7.152 7.152 0 011.076-.737c.39-.214.802-.39 1.23-.527.422-.134.86-.222 1.31-.257.435-.034.867-.014 1.285.046.42.064.826.18 1.21.344.39.166.76.38 1.09.63.332.257.634.55.9.87.264.322.49.67.668 1.04.18.376.31.77.388 1.18.077.41.11.83.097 1.25-.013.435-.07.86-.17 1.274-.1.413-.247.81-.44 1.183-.19.37-.424.715-.7 1.03a11.95 11.95 0 01-.986.994c-.37.33-.77.63-1.2.9-.43.27-.89.5-1.37.68-.48.18-.99.31-1.51.38a1 1 0 00-.332.06c-.52.2-.99.5-1.41.87a1 1 0 00-.23.332V17h1l1-1z" clipRule="evenodd" /></svg>
        </div>
        
        <h3 className="text-slate-500 font-semibold text-xs uppercase tracking-wider mb-6">Compliance Score</h3>
        
        <div className="flex flex-col items-center py-4">
          <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 ${getScoreColor(result.riskScore)}`}>
            <span className="text-5xl font-black">{getScoreLetter(result.riskScore)}</span>
            <span className="text-sm font-bold opacity-80">{result.riskScore}/100</span>
          </div>
          <p className="mt-4 font-bold text-slate-800">
            {result.riskScore > 70 ? 'High Risk Exposure' : 'Substantial Compliance'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Based on {result.violationsCount} potential violation{result.violationsCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Financial Liability</h3>
          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">GDPR PENALTY</span>
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-red-600">
            {formattedFineMin} - {formattedFineMax}
          </div>
          <p className="text-xs text-slate-400">Rough estimate only. Actual fines depend on regulatory decisions, company factors, and legal review. This is not legal advice.</p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-50">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
             <div className="flex space-x-2">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                <p className="text-[10px] text-amber-700 leading-tight">
                   Note: GDPR fines can reach up to €20M or 4% of annual global turnover, whichever is higher.
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
        <h3 className="font-bold mb-2">Need a Formal Report?</h3>
        <p className="text-sm text-blue-100 mb-4 leading-relaxed">
          Generate a stamped PDF document for legal counsel or board presentations.
        </p>
        <button className="w-full bg-white text-blue-600 font-bold py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">
          Download Certified Audit
        </button>
      </div>
    </aside>
  );
};
