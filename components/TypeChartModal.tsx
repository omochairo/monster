
import React from 'react';
import { X } from 'lucide-react';
import { TypeChartContent } from './TypeChartContent';

interface TypeChartModalProps {
  onClose: () => void;
}

export const TypeChartModal: React.FC<TypeChartModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
          <h3 className="text-xl font-black">属性（ぞくせい）のヒント</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto bg-gray-50">
          <p className="text-sm text-gray-500 mb-4 text-center font-bold">
            ひだりのタイプは、みぎのタイプに強いよ！<br/>
            バトルで勝つためのヒントだよ。
          </p>

          <TypeChartContent />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white">
           <button onClick={onClose} className="w-full py-3 rounded-full bg-gray-200 font-bold text-gray-600 hover:bg-gray-300 transition-colors">
             閉じる
           </button>
        </div>
      </div>
    </div>
  );
};
