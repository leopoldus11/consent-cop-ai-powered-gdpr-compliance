import React, { useState } from 'react';
import { SubscriptionTier } from '../services/auth';
import { setCustomApiKey } from '../services/auth';

interface UpgradePromptProps {
  tier: SubscriptionTier;
  reason?: string;
  scansRemaining: number;
  onUpgrade?: (tier: SubscriptionTier) => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  tier, 
  reason, 
  scansRemaining,
  onUpgrade 
}) => {
  const [showBYOK, setShowBYOK] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBYOKSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!apiKey.trim()) {
        setError('Please enter a valid API key');
        return;
      }
      
      await setCustomApiKey(apiKey.trim());
      setShowBYOK(false);
      setApiKey('');
      // Refresh the page to update scan limits
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to save API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tier === 'byok' || tier === 'enterprise') {
    return null; // No upgrade needed
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 sm:p-8 shadow-lg mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900 mb-2">Scan Limit Reached</h3>
          <p className="text-sm text-slate-600 mb-4">{reason || 'You\'ve used all your available scans.'}</p>
          
          {!showBYOK ? (
            <div className="space-y-3">
              {/* Pricing Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Starter Tier */}
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900">Starter</h4>
                    <span className="text-2xl font-black text-blue-600">$9</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">50 scans/month</p>
                  <button
                    onClick={() => onUpgrade?.('starter')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all"
                  >
                    Upgrade to Starter
                  </button>
                </div>

                {/* Pro Tier */}
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900">Pro</h4>
                    <span className="text-2xl font-black text-blue-600">$29</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">200 scans/month</p>
                  <button
                    onClick={() => onUpgrade?.('pro')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </div>

              {/* BYOK Option */}
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-white">Bring Your Own Key</h4>
                    <p className="text-xs text-slate-400">Use your own Gemini API key</p>
                  </div>
                  <span className="text-2xl font-black text-emerald-500">Free</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Unlimited scans. You pay Google directly (~$0.17-0.34 per scan)
                </p>
                <button
                  onClick={() => setShowBYOK(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all"
                >
                  Set Up BYOK
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBYOKSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Get your API key from{' '}
                  <a 
                    href="https://ai.google.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save API Key'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBYOK(false);
                    setApiKey('');
                    setError(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

