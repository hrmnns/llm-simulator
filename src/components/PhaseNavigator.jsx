import React from 'react';

const phases = [
  { id: 0, name: "Tokenization" },
  { id: 1, name: "Embedding" },
  { id: 2, name: "Attention" },
  { id: 3, name: "FFN" },
  { id: 4, name: "Decoding" },
  { id: 5, name: "Analysis" }
];

const PhaseNavigator = ({ activePhase, setActivePhase }) => {
  return (
    <nav className="flex justify-center bg-slate-900 border-b border-slate-800 p-2 gap-2">
      {phases.map((phase) => (
        <button
          key={phase.id}
          onClick={() => setActivePhase(phase.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activePhase === phase.id 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          {phase.id}: {phase.name}
        </button>
      ))}
    </nav>
  );
};

export default PhaseNavigator;