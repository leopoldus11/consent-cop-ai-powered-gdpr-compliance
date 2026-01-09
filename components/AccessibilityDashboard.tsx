import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Hand, MessageSquare, ShieldCheck, Accessibility, Info } from 'lucide-react';
import { AccessibilityResult } from '../types';

interface AccessibilityDashboardProps {
  accessibility: AccessibilityResult | undefined;
}

export const AccessibilityDashboard: React.FC<AccessibilityDashboardProps> = ({ accessibility }) => {
  if (!accessibility) return null;

  const { pourScores, score, violations, wcag22Compliant } = accessibility;

  // POUR Score labels and icons with safe defaults
  const pScore = pourScores?.perceivable ?? 0;
  const oScore = pourScores?.operable ?? 0;
  const uScore = pourScores?.understandable ?? 0;
  const rScore = pourScores?.robust ?? 0;

  const pourData = [
    { label: 'Perceivable', value: pScore, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', desc: 'Can users see and hear the content?' },
    { label: 'Operable', value: oScore, icon: Hand, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', desc: 'Can users navigate and interact?' },
    { label: 'Understandable', value: uScore, icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', desc: 'Is the interface and info clear?' },
    { label: 'Robust', value: rScore, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', desc: 'Does it work with assistive tech?' }
  ];

  // Custom Radar Chart Points (Simplified for 4 axes)
  // Axes: 0: Top (Perceivable), 1: Right (Operable), 2: Bottom (Understandable), 3: Left (Robust)
  const size = 200;
  const center = size / 2;
  const radius = size * 0.4;

  const getPoint = (index: number, value: number) => {
    const angle = (index * (Math.PI / 2)) - (Math.PI / 2);
    const length = (value / 100) * radius;
    return {
      x: center + length * Math.cos(angle),
      y: center + length * Math.sin(angle)
    };
  };

  const points = pourData.map((d, i) => getPoint(i, d.value));
  const pathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;

  return (
    <div className="mb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 animate-pulse"></div>
          <div className="relative w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-2xl">
            <Accessibility className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Accessibility Audit</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">EAA 2025/2026 POUR Framework</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Radar Chart Section */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-sm">
          <div className="relative mb-6">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Grid Background */}
              {[25, 50, 75, 100].map((level) => {
                const p = [0, 1, 2, 3].map(i => getPoint(i, level));
                return (
                  <path
                    key={level}
                    d={`M ${p[0].x} ${p[0].y} L ${p[1].x} ${p[1].y} L ${p[2].x} ${p[2].y} L ${p[3].x} ${p[3].y} Z`}
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                );
              })}
              
              {/* Axes */}
              {[0, 1, 2, 3].map(i => {
                const p = getPoint(i, 100);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={p.x}
                    y2={p.y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Data Area */}
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d={pathData}
                fill="rgba(37, 99, 235, 0.1)"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Axis Labels */}
              {pourData.map((d, i) => {
                const p = getPoint(i, 115);
                return (
                  <text
                    key={i}
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[9px] font-black fill-slate-400 uppercase tracking-tighter"
                  >
                    {d.label}
                  </text>
                );
              })}
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-3xl font-black text-slate-900">{score}</div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Score</div>
              </div>
            </div>
          </div>

          <div className="w-full pt-6 border-t border-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compliance Status</span>
              {wcag22Compliant ? (
                <span className="text-[10px] font-black text-emerald-500 uppercase">WCAG 2.2 PASS</span>
              ) : (
                <span className="text-[10px] font-black text-red-500 uppercase">WCAG 2.2 FAIL</span>
              )}
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                className={`h-full ${score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
              />
            </div>
          </div>
        </div>

        {/* POUR Grid Section */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {pourData.map((d, i) => (
            <div key={i} className={`p-6 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 transition-all group`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 ${d.bg} rounded-xl flex items-center justify-center ${d.color} group-hover:scale-110 transition-transform`}>
                  <d.icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">{d.value}%</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Efficiency</div>
                </div>
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{d.label}</h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">{d.desc}</p>
              
              <div className="flex items-center gap-1.5 pt-4 border-t border-slate-50">
                <Info className="w-3 h-3 text-slate-300" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                  {d.value === 100 ? 'Full Compliance' : 'Optimization Required'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accessibility Violations List */}
      {!wcag22Compliant && violations && Array.isArray(violations) && violations.length > 0 && (
        <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-3xl">
          <h4 className="text-xs font-black text-red-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            EAA 2025/2026 Critical Failures
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {violations.map((v, i) => (
              <div key={i} className="flex items-center gap-3 text-xs font-bold text-red-700 bg-white/50 p-3 rounded-xl border border-red-200/50">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                {v}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AlertTriangle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

