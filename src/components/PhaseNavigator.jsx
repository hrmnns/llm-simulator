import React from 'react';

const PhaseNavigator = ({ activePhase, setActivePhase }) => {
  const phaseNames = ["Tokenize", "Embed", "Attention", "FFN", "Decoding", "Analysis"];

  return (
    <nav className="flex justify-center bg-slate-900 border-b border-slate-800 p-2 gap-2 overflow-x-auto">
      {phaseNames.map((name, index) => (
        <button 
          key={index}
          onClick={() => setActivePhase(index)}
          className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
            activePhase === index 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="opacity-50 mr-1">{index}</span> {name}
        </button>
      ))}
    </nav>
  );
};

export default PhaseNavigator;