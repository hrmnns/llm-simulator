import { useScenarios } from '../context/ScenarioContext';

const Header = () => {
  const { scenarios, activeScenario, handleScenarioChange } = useScenarios();

  return (
    <header className="flex justify-between items-center p-4 bg-slate-900 text-white shadow-lg">
      <div className="font-bold text-xl text-blue-400 font-mono tracking-tighter">
        LLM-EXPLORER <span className="text-[10px] opacity-50 ml-1">v2.3</span>
      </div>
      
      <div className="flex items-center gap-3">
        <label htmlFor="scenario-select" className="text-xs uppercase tracking-widest text-slate-500 font-bold">
          Szenario:
        </label>
        <select 
          id="scenario-select"
          className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-100"
          value={activeScenario?.id || ''}
          onChange={(e) => handleScenarioChange(e.target.value)}
        >
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 items-center">
        <button className="text-xs hover:text-blue-300 transition-colors uppercase font-bold tracking-widest">Glossar</button>
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors">
          🌙
        </div>
      </div>
    </header>
  );
};

// DIESE ZEILE FEHLT WAHRSCHEINLICH:
export default Header;