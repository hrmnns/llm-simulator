import React from 'react';

const PhaseLayout = ({
    title,
    subtitle,
    badges = [], 
    visualization,
    controls,
    theme = 'dark'
}) => {
    return (
        /* KORREKTUR: p-4 auf Mobile und p-6 auf Desktop. 
           Dies entspricht dem Standard-Padding der PhaseSidebar, 
           sodass beide Header auf exakt der gleichen Höhe starten. */
        <div className="flex flex-col h-full w-full overflow-hidden animate-in fade-in duration-500 p-4 lg:p-6">

            {/* HEADER: mb-4 und pb-4 sorgen für eine klare, fluchtende Trennung */}
            <header className="flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0 border-b border-white/5 pb-4">
                <div className="flex flex-col min-w-[150px]">
                    {/* leading-none verhindert, dass Text-Line-Height die Ausrichtung verschiebt */}
                    <h2 className="text-blue-500 uppercase font-black tracking-[0.2em] text-[9px] mb-1 leading-none">
                        {title}
                    </h2>
                    <p className={`text-base font-bold tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {subtitle}
                    </p>
                </div>

                {/* BADGE-CONTAINER */}
                <div className="flex flex-wrap gap-2 items-center lg:justify-end ml-auto">
                    {badges && badges.length > 0 && badges.map((badge, idx) => (
                        <div
                            key={idx}
                            className={`px-2 py-0.5 rounded-md border text-[8px] font-mono font-bold uppercase tracking-wider whitespace-nowrap shadow-sm ${badge.className}`}
                        >
                            {badge.text}
                        </div>
                    ))}
                </div>
            </header>

            {/* HAUPT-VISUALISIERUNG: 
                Innere Box erhält p-4, um den Inhalt sauber vom dunklen Rand abzusetzen. */}
            <div className="flex-1 min-h-0 relative bg-slate-950/40 rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-inner">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {visualization}
                </div>
            </div>

            {/* EINSTELLUNGEN FOOTER */}
            {controls && (
                <footer className="shrink-0 mt-4 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr gap-4">
                        {controls}
                    </div>
                </footer>
            )}
        </div>
    );
};

export default PhaseLayout;