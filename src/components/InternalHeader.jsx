import React from 'react';

const InternalHeader = ({ theme, toggleTheme, onOpenHelp, scenarios, activeScenario, onScenarioChange }) => (
  <header className={`w-full px-6 py-4 flex flex-col md:flex-row justify-between items-center border-b transition-colors duration-500 z-50 ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
  }`}>
    <div className="flex items-center gap-6 mb-4 md:mb-0">
      <h1 className="text-lg font-black uppercase tracking-tighter text-blue-500">
        LLM Explorer <span className="font-light opacity-50 text-[10px] tracking-normal">Sim Lab</span>
      </h1>
      <div className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
        theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-300'
      }`}>
        <span className="text-[9px] font-black uppercase px-2 opacity-50">Szenario:</span>
        <select
          value={activeScenario?.id || ""}
          onChange={(e) => onScenarioChange(e.target.value)}
          className="bg-transparent text-xs font-bold outline-none cursor-pointer pr-2 text-blue-500 focus:ring-0"
        >
          {scenarios?.map(s => (
            <option key={s.id} value={s.id} className={theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-blue-500/10 transition-all text-xl">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <button onClick={onOpenHelp} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-lg uppercase transition-all shadow-lg shadow-blue-900/20">
        Wissens-DB
      </button>
    </div>
  </header>
);

export default InternalHeader;