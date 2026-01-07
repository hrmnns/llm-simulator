import React from 'react';
import { useScenarios } from '../../context/ScenarioContext';

const Phase0_Tokenization = () => {
  const { activeScenario } = useScenarios();

  if (!activeScenario) return null;

  const { tokens } = activeScenario.phase_0_tokenization;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h2 className="text-2xl font-light mb-8 text-slate-400">Input Zerlegung</h2>
      
      <div className="flex flex-wrap gap-4 justify-center">
        {tokens.map((token) => (
          <div 
            key={token.id}
            className="group relative bg-slate-800 border border-slate-700 p-6 rounded-lg shadow-xl hover:border-blue-500 transition-all cursor-help"
          >
            <span className="text-3xl font-mono text-blue-400">{token.text}</span>
            <div className="text-xs text-slate-500 mt-2 tracking-widest uppercase">
              ID: {token.id.toString().padStart(3, '0')}
            </div>
            
            {/* Tooltip für die Erklärung aus der JSON */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-2 bg-slate-900 text-xs text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700 shadow-2xl z-10">
              {token.explanation}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-md text-center text-slate-400 italic">
        "Tokens sind nicht einfach Wörter, sondern die semantischen Atome, mit denen die KI rechnet."
      </div>
    </div>
  );
};

export default Phase0_Tokenization;