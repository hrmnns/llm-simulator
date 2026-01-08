import React from 'react';

const GlossaryModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h2 className="text-xl font-bold text-blue-400 uppercase tracking-tighter">
            Wissens-Datenbank
          </h2>
          <button 
            onClick={onClose} 
            className="text-3xl font-light hover:text-blue-400 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-950/50 custom-scrollbar">
          {data?.terms?.length > 0 ? (
            data.terms.map((term, i) => (
              <div key={i} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-colors">
                <h3 className="text-blue-400 text-sm font-bold uppercase tracking-wider">
                  {term.title}
                </h3>
                <p className="text-slate-300 text-[12px] italic mt-2 leading-relaxed">
                  {term.content}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs font-mono uppercase">
              Lade Definitionen...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlossaryModal;