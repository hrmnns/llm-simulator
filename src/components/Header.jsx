import React from 'react';
import { useScenarios } from '../context/ScenarioContext';

const Header = () => {
  // Wir nutzen handleScenarioChange statt setActiveScenario direkt
  const { scenarios, activeScenario, handleScenarioChange } = useScenarios();

  return (
    <header className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
      <h1 className="text-xl font-bold text-white">LLM Simulator</h1>
      
      <select 
        value={activeScenario?.id || ''}
        onChange={(e) => handleScenarioChange(e.target.value)}
        className="bg-slate-800 text-blue-400 border border-slate-700 rounded px-2 py-1 outline-none"
      >
        {scenarios?.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </header>
  );
};

export default Header;