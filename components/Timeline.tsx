
import React from 'react';
import { RequestLog } from '../types';

interface TimelineProps {
  requests: RequestLog[];
}

export const Timeline: React.FC<TimelineProps> = ({ requests }) => {
  const sorted = [...requests].sort((a, b) => a.timestamp - b.timestamp);
  const minTime = sorted[0]?.timestamp || 0;
  const maxTime = sorted[sorted.length - 1]?.timestamp || 0;
  const duration = maxTime - minTime || 1;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-slate-900 font-black text-lg">Request Lifecycle</h3>
          <p className="text-slate-400 text-xs font-medium">Visualization of tracking triggers relative to audit milestones</p>
        </div>
        <div className="flex space-x-6 text-[10px] font-black tracking-widest uppercase">
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 shadow-sm shadow-red-200"></span>
            <span className="text-slate-500">Illegal Trigger</span>
          </div>
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-200"></span>
            <span className="text-slate-500">Compliant Trigger</span>
          </div>
        </div>
      </div>

      <div className="relative h-32 mb-8 px-4">
        {/* Timeline Axis */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-50 -translate-y-1/2 rounded-full overflow-hidden">
           <div className="h-full bg-gradient-to-r from-red-100 via-slate-100 to-emerald-100"></div>
        </div>
        
        {/* Consent Marker */}
        <div className="absolute top-0 bottom-0 left-[70%] w-px border-l-2 border-dashed border-slate-300 z-10 flex flex-col items-center">
          <div className="absolute -top-6 bg-slate-900 text-white px-3 py-1 rounded-full text-[9px] font-black shadow-lg shadow-slate-200">
            SIMULATED CONSENT ACTION
          </div>
        </div>

        {/* Requests */}
        <div className="relative h-full">
          {sorted.map((req, idx) => {
            const left = ((req.timestamp - minTime) / duration) * 100;
            const isTop = idx % 2 === 0;
            return (
              <div
                key={req.id}
                className="absolute group -translate-x-1/2 cursor-pointer transition-all duration-300"
                style={{ left: `${left}%`, top: isTop ? '15%' : '65%' }}
              >
                <div className={`w-6 h-6 rounded-xl border-4 border-white shadow-md transition-all group-hover:scale-125 group-hover:rotate-12 ${
                  req.status === 'violation' ? 'bg-red-500' : 'bg-emerald-500'
                }`}></div>
                
                {/* Visual Connector */}
                <div className={`absolute left-1/2 -translate-x-1/2 w-px h-6 bg-slate-200 ${isTop ? 'top-full' : 'bottom-full'}`}></div>
                
                {/* Tooltip */}
                <div className={`absolute ${isTop ? 'bottom-full mb-3' : 'top-full mt-3'} left-1/2 -translate-x-1/2 hidden group-hover:block z-30`}>
                  <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl whitespace-nowrap min-w-[180px]">
                    <div className="font-black text-xs mb-1">{req.domain}</div>
                    <div className="flex space-x-2 mb-2">
                       <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded uppercase">{req.type}</span>
                    </div>
                    <div className="text-[10px] space-y-1">
                       {req.dataTypes.map(dt => (
                         <div key={dt} className="flex items-center text-red-400">
                           <div className="w-1 h-1 rounded-full bg-red-400 mr-1.5"></div>
                           {dt}
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest px-4 pt-4 border-t border-slate-50">
        <span className="flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
          T=0.00s Page Load
        </span>
        <span className="font-mono">Real-time Traffic Monitor</span>
        <span>Audit Finished (+{Math.round(duration/1000)}s)</span>
      </div>
    </div>
  );
};
