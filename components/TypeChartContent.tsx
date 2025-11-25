
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ELEMENTS, TYPE_ADVANTAGES } from '../services/geminiService';

export const TypeChartContent: React.FC = () => {
  return (
    <div className="space-y-3">
      {ELEMENTS.map((attacker) => {
        // Find who this element is strong against
        const strongAgainstIds = TYPE_ADVANTAGES[attacker.id];
        if (!strongAgainstIds || strongAgainstIds.length === 0) return null;

        const targets = strongAgainstIds.map(id => ELEMENTS.find(e => e.id === id)).filter(Boolean);

        return (
          <div key={attacker.id} className="flex items-center bg-white/80 rounded-xl p-3 border border-gray-100 shadow-sm">
            {/* Attacker */}
            <div className={`
              shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full ${attacker.color} 
              flex items-center justify-center text-xl md:text-2xl text-white shadow-md
            `}>
              {attacker.icon}
            </div>
            
            {/* Arrow & "Strong" text */}
            <div className="px-2 md:px-4 flex flex-col items-center justify-center text-gray-400">
               <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">つよい</span>
               <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-red-300" />
            </div>

            {/* Targets */}
            <div className="flex flex-wrap gap-2 flex-1 items-center">
              {targets.map((target) => (
                <div key={target?.id} className={`
                  px-2 py-1 rounded-full ${target?.color} 
                  flex items-center gap-1 text-white shadow-sm ring-1 ring-white
                `} title={target?.label}>
                  <span className="text-sm md:text-base">{target?.icon}</span>
                  <span className="text-xs font-bold md:inline hidden">{target?.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
