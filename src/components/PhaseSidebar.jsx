import React, { useState } from 'react';

const PhaseSidebar = ({ activePhase, activeScenario, simulator, theme, isExpanded, setIsExpanded, hoveredItem }) => {
    const [showTech, setShowTech] = useState(true); // Standardmäßig offen für schnellen Zugriff

    const phaseContent = [
        { title: "Tokenisierung", details: "Text wird in kleine Einheiten (Tokens) zerlegt. Jeder Token erhält eine ID." },
        { title: "Vektorraum", details: "Wörter werden im Vektorraum platziert. Mathematische Nähe entspricht semantischer Ähnlichkeit." },
        { title: "Attention", details: "Das Modell bestimmt, welche Wörter im Kontext für die Bedeutung entscheidend sind." },
        { title: "FFN & Wissen", details: "Aktivierung gespeicherten Wissens in Kategorien wie 'Wissenschaft' oder 'Poesie'." },
        { title: "Decoding", details: "Berechnung der Wahrscheinlichkeiten. Hier entscheidet die 'Temperature' über Präzision oder Kreativität." },
        { title: "Analyse", details: "Interpretation der finalen Ergebnisse und des gewählten Pfades." }
    ];

    // Minimierter Zustand (Handle) - behält die Breite bei, um Layout-Shifts im Hauptpanel zu minimieren
    if (!isExpanded) return (
        <div className="w-[320px] h-full flex items-center justify-center border-l border-slate-800 bg-slate-900/20 backdrop-blur-md">
            <button
                onClick={() => setIsExpanded(true)}
                className={`
                group relative flex flex-col items-center justify-center
                w-12 h-64 rounded-2xl border transition-all duration-500
                ${theme === 'dark'
                        ? 'bg-slate-900/60 border-slate-700 hover:bg-blue-600/20 hover:border-blue-500/50'
                        : 'bg-white border-slate-200 hover:bg-blue-50 shadow-sm'}
            `}
            >
                <div className="absolute inset-y-4 left-0 w-[2px] bg-blue-500 rounded-full opacity-40 group-hover:opacity-100 transition-opacity" />
                <span className="rotate-180 [writing-mode:vertical-lr] text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/70 group-hover:text-blue-500">
                    Details einblenden
                </span>
                <div className="mt-4 text-blue-500/40 group-hover:text-blue-500 text-lg">«</div>
            </button>
        </div>
    );

    // Optimierte MetricBox für das 2-Spalten-Grid
    const MetricBox = ({ label, value, unit = "", color = "text-blue-500" }) => (
        <div className="flex flex-col p-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10 transition-all hover:bg-slate-500/10">
            <span className="text-[7px] uppercase font-black opacity-40 tracking-widest mb-1">{label}</span>
            <span className={`text-[11px] font-mono font-bold truncate ${color}`}>{value}{unit}</span>
        </div>
    );

    return (
        <div className={`w-[320px] min-w-[320px] max-w-[320px] h-full flex flex-col p-6 rounded-[2.5rem] border shadow-2xl transition-all duration-500 overflow-hidden ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800 backdrop-blur-md' : 'bg-white border-slate-200'}`}>

            {/* 1. Header (Statisch) */}
            <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">System Monitoring</h3>
                    <h4 className="text-sm font-bold uppercase tracking-tighter">{phaseContent[activePhase]?.title}</h4>
                </div>
                <button onClick={() => setIsExpanded(false)} className="text-[20px] opacity-30 hover:opacity-100 transition-opacity">×</button>
            </div>

            {/* 2. Inhaltsbereich mit erzwungener Laufleiste (overflow-y-scroll) */}
            <div className="flex-1 space-y-6 overflow-y-scroll pr-2 custom-scrollbar">

                {/* Definition */}
                <section>
                    <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-500/10 border-l-4 border-l-blue-500">
                        <p className="text-[11px] leading-relaxed opacity-80 italic">{phaseContent[activePhase]?.details}</p>
                    </div>
                </section>

                {/* Live Parameter (Kompaktes Grid) */}
                <section>
                    <button
                        onClick={() => setShowTech(!showTech)}
                        className="w-full flex justify-between items-center text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Live Parameter {showTech ? '▼' : '▲'}
                    </button>

                    {showTech && (
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="col-span-2">
                                <MetricBox label="Szenario" value={activeScenario?.name} />
                            </div>

                            {(activePhase === 1 || activePhase === 2) && (
                                <>
                                    <MetricBox label="Noise" value={(simulator.noise * 100).toFixed(0)} unit="%" />
                                    <MetricBox label="Pos. W" value={simulator.positionWeight.toFixed(2)} />
                                </>
                            )}

                            {activePhase === 3 && (
                                <>
                                    <MetricBox label="Filter" value={simulator.mlpThreshold.toFixed(2)} />
                                    <MetricBox label="Profile" value={simulator.activeProfileId} color="text-green-500" />
                                </>
                            )}

                            {activePhase === 4 && (
                                <>
                                    <MetricBox
                                        label="Temp"
                                        value={simulator.temperature.toFixed(2)}
                                        color={simulator.temperature > 1.2 ? "text-orange-500" : "text-blue-500"}
                                    />
                                    <MetricBox
                                        label="Risk"
                                        value={simulator.temperature > 1.5 ? "HOCH" : "OK"}
                                        color={simulator.temperature > 1.5 ? "text-red-500" : "text-green-500"}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </section>

                {/* Detail-Inspektor & Roter Faden */}
                <section className="flex flex-col border-t border-slate-500/10 pt-4 pb-4">
                    <p className="text-[10px] font-black text-blue-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hoveredItem ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></span>
                        Kausale Analyse
                    </p>

                    <div className={`min-h-[160px] rounded-2xl border transition-all duration-300 ${hoveredItem
                        ? (theme === 'dark' ? 'bg-slate-800/50 border-blue-500/30 p-4' : 'bg-blue-50/50 border-blue-200 p-4')
                        : 'border-dashed border-slate-800/50 flex items-center justify-center p-4'
                    }`}>
                        {hoveredItem ? (
                            <div className="animate-in fade-in duration-300">
                                <h6 className="text-[11px] font-bold uppercase mb-3 text-blue-500 border-b border-blue-500/10 pb-1">
                                    {hoveredItem.title}
                                </h6>

                                <div className="space-y-3">
                                    {Object.entries(hoveredItem.data || {}).map(([key, value]) => {
                                        // Highlight für den roten Faden (Trace-Analyse)
                                        if (key === "Trace-Analyse") {
                                            return (
                                                <div key={key} className="mt-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-inner">
                                                    <span className="text-[7px] uppercase font-black text-blue-400 block mb-1">Pipeline Trace</span>
                                                    <p className="text-[10px] leading-relaxed italic text-slate-200">{value}</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={key} className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-1">
                                                <span className="opacity-40 uppercase tracking-tighter">{key}</span>
                                                <span className="font-bold text-blue-500">{value}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <span className="text-[9px] uppercase tracking-widest opacity-20 italic">
                                    Element wählen für Trace
                                </span>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* 3. Footer (Statisch) */}
            <div className="mt-4 pt-4 border-t border-slate-500/10 shrink-0">
                <div className="flex justify-between items-center opacity-30 text-[8px] font-black uppercase tracking-[0.2em]">
                    <span>Kausalitäts-Modus</span>
                    <span className="text-green-500 font-mono">Standby</span>
                </div>
            </div>
        </div>
    );
};

export default PhaseSidebar;