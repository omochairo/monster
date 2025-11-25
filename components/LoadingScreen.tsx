
import React, { useEffect, useState } from 'react';
import { LOADING_MESSAGES } from '../constants';
import { Wand2 } from 'lucide-react';
import { TypeChartContent } from './TypeChartContent';

export const LoadingScreen: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 animate-fade-in pb-20">
      
      {/* Loading Animation Section */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-pink-300 rounded-full opacity-30 animate-ping"></div>
          <div className="bg-white p-6 rounded-full shadow-xl relative z-10">
            <Wand2 className="w-16 h-16 text-pink-500 animate-spin-slow" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-700 mb-2">
          {LOADING_MESSAGES[messageIndex]}
        </h3>
      </div>

      {/* Type Chart Section */}
      <div className="w-full max-w-md bg-white/50 rounded-3xl p-4 md:p-6 border-2 border-dashed border-pink-200">
         <div className="text-center mb-4">
             <span className="bg-pink-100 text-pink-600 px-4 py-1 rounded-full text-xs font-bold">
                 今のうちに 予習（よしゅう）しよう！
             </span>
             <h4 className="text-lg font-black text-gray-700 mt-2">
                 属性（ぞくせい）のヒント
             </h4>
         </div>
         
         <div className="h-64 md:h-80 overflow-y-auto pr-1 custom-scrollbar">
            <TypeChartContent />
         </div>
      </div>

    </div>
  );
};
