import React from 'react';
import { Question, Option } from '../types';

interface QuestionScreenProps {
  question: Question;
  onAnswer: (option: Option) => void;
  currentStepIndex: number;
  totalSteps: number;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({ 
  question, 
  onAnswer,
  currentStepIndex,
  totalSteps
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col h-full animate-fade-in">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-3 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-pink-400 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-8">
        Q{question.id}. {question.text}
      </h2>

      <div className="grid gap-4 md:grid-cols-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onAnswer(option)}
            className={`
              ${option.color} 
              flex flex-col items-center justify-center 
              p-6 rounded-3xl border-b-8 active:border-b-0 active:translate-y-2
              transition-all duration-200 cursor-pointer
              group h-48 md:h-56
            `}
          >
            <span className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
              {option.emoji}
            </span>
            <span className="font-bold text-gray-700 text-lg">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
