import React from 'react';

const PhaseBriefing = ({ data, onClose, theme, autoShow, onToggleAutoShow }) => {
  if (!data) return null;

  return (
    /* KORREKTUR: fixed und z-[200] sorgt dafür, dass es ÜBER ALLEM liegt.
       inset-0 und flex items-center zentrieren es perfekt im Browser-Fenster. */
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in duration-300">
      
      {/* Backdrop: Dunkelt die GESAMTE Seite ab */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Die Card: max-h-[90vh] erlaubt Scrollen innerhalb der Card auf kleinen Handys */}
      <div className={`relative max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 rounded-[2.5rem] border shadow-2xl transition-all ${
        theme === 'dark' ? 'bg-slate-900 border-blue-500/30 shadow-blue-500/40 text-white' : 'bg-white border-blue-200 shadow-xl text-slate-900'
      }`}>
        
        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div className="pr-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1 leading-none">Briefing Phase</h4>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight">
              {data.title}
            </h2>
          </div>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex-none flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">🚀</div>
        </div>

        {/* MISSION */}
        <p className={`text-sm mb-6 leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {data.mission}
        </p>

        {/* MISSION STEPS */}
        <div className="space-y-4 mb-8">
          <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <span className="w-4 h-px bg-slate-700"></span> Deine Mission
          </h5>
          <ul className="space-y-3">
            {data.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-xs leading-relaxed">
                <span className="text-blue-500 font-bold">{i + 1}.</span>
                <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* INSIGHT BOX */}
        <div className={`p-4 rounded-2xl mb-8 border ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100'}`}>
          <p className="text-[10px] italic text-blue-400 leading-relaxed text-center">
            <strong>Aha-Moment:</strong> {data.insight}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-4">
          {data.externalResource && (
            <a 
              href={data.externalResource.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-3 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                theme === 'dark' 
                  ? 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' 
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-blue-600'
              }`}
            >
              <span className="text-sm">🌐</span> {data.externalResource.label}
            </a>
          )}

          {/* CHECKBOX: Verhindert automatisches Einblenden */}
          <div className="flex items-center justify-center py-1">
            <label className="flex items-center cursor-pointer group select-none">
              <input 
                type="checkbox" 
                checked={!autoShow}
                onChange={(e) => onToggleAutoShow(!e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-4 h-4 flex-none rounded border transition-all flex items-center justify-center ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 peer-checked:bg-blue-600 peer-checked:border-blue-500' 
                  : 'bg-slate-100 border-slate-300 peer-checked:bg-blue-500 peer-checked:border-blue-400'
              }`}>
                <div className="w-2 h-2 bg-white rounded-sm scale-0 peer-checked:scale-100 transition-transform" 
                     style={{ clipPath: 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)' }} />
              </div>
              <span className={`ml-3 text-[9px] font-black uppercase tracking-widest transition-colors ${
                theme === 'dark' ? 'text-slate-500 group-hover:text-slate-400' : 'text-slate-400 group-hover:text-slate-600'
              }`}>
                Dialog nicht mehr automatisch anzeigen
              </span>
            </label>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-2xl uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-900/40 active:scale-[0.98]"
          >
            Analyse starten
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhaseBriefing;