import React from 'react';

const Header = ({ onOpenHelp, theme, toggleTheme, scenarios, activeScenario, onScenarioChange }) => {
  return (
    <header className={`w-full px-6 py-4 flex justify-between items-center border-b ${
      theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center gap-8">
        <h1 className="text-lg font-black uppercase tracking-tighter text-blue-500">
          LLM Explorer <span className="font-light opacity-50">v2.3</span>
        </h1>

        {/* SCENARIO SELECTOR */}
        <div className="flex items-center gap-3 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          <span className="text-[9px] font-black uppercase px-2 opacity-50">Szenario:</span>
          <select 
            value={activeScenario?.id} 
            onChange={(e) => onScenarioChange(parseInt(e.target.value))}
            className="bg-transparent text-xs font-bold outline-none cursor-pointer pr-4"
          >
            {scenarios.map(s => (
              <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 opacity-50 hover:opacity-100 transition-all text-xl">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button 
          onClick={onOpenHelp}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-lg uppercase transition-all shadow-lg shadow-blue-900/20"
        >
          Glossar
        </button>
      </div>
    </header>
  );
};

export default Header;