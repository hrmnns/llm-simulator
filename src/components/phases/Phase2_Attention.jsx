import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PhaseLayout from './../PhaseLayout';
import { useScenarios } from '../../context/ScenarioContext';

const Phase2_Attention = ({ simulator, setHoveredItem, theme }) => {
  const { activeScenario } = useScenarios();
  const { activeProfileId, setActiveProfileId } = simulator;
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [hoveredTokenId, setHoveredTokenId] = useState(null);
  const [activeHead, setActiveHead] = useState(1);

  if (!activeScenario) return null;

  const tokens = activeScenario?.phase_0_tokenization?.tokens || [];
  const profiles = activeScenario?.phase_2_attention?.attention_profiles || [];

  const size = 400; 
  const center = 200;
  const radius = 140; 

  const currentProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || profiles[0];
  }, [profiles, activeProfileId]);

  const sourceTokenId = useMemo(() => {
    if (selectedTokenId) return selectedTokenId;
    if (currentProfile?.rules?.length > 0) return currentProfile.rules[0].source;
    return tokens[tokens.length - 2]?.id || tokens[0]?.id;
  }, [selectedTokenId, currentProfile, tokens]);

  const sourceToken = tokens.find(t => Number(t.id) === Number(sourceTokenId));

  const headDefinitions = {
    1: { label: "Semantik", desc: "Lexikalische Nähe" },
    2: { label: "Syntax", desc: "Grammatik & Lage" },
    3: { label: "Logik", desc: "Handlung & Ziel" },
    4: { label: "Struktur", desc: "Referenz & Artikel" }
  };

  const activeRules = useMemo(() => {
    if (!currentProfile?.rules) return [];
    return currentProfile.rules.filter(r => {
      const isCorrectSource = Number(r.source) === Number(sourceTokenId);
      const isCorrectHead = r.head ? Number(r.head) === Number(activeHead) : true;
      return isCorrectSource && isCorrectHead;
    });
  }, [currentProfile, sourceTokenId, activeHead]);

  const headStats = useMemo(() => {
    const stats = { 1: 0, 2: 0, 3: 0, 4: 0 };
    if (!currentProfile?.rules) return stats;
    currentProfile.rules.forEach(r => {
      stats[r.head] = (stats[r.head] || 0) + 1;
    });
    return stats;
  }, [currentProfile]);

  // NEU: Ermittelt alle Token-IDs, die im aktiven Head eine Rolle spielen (Source oder Target)
  const tokensWithActivityInHead = useMemo(() => {
    if (!currentProfile?.rules) return new Set();
    const activeIds = new Set();
    currentProfile.rules.forEach(r => {
      if (Number(r.head) === Number(activeHead)) {
        activeIds.add(Number(r.source));
        activeIds.add(Number(r.target));
      }
    });
    return activeIds;
  }, [currentProfile, activeHead]);

  const updateInspector = useCallback((targetId, isHover = false) => {
    let effectiveTargetId = targetId;
    let rule = activeRules.find(r => Number(r.target) === Number(effectiveTargetId));

    if (!isHover && (!rule || Number(targetId) === Number(sourceTokenId))) {
      const strongestRule = [...activeRules].sort((a, b) => b.strength - a.strength)[0];
      if (strongestRule) {
        effectiveTargetId = strongestRule.target;
        rule = strongestRule;
      } else {
        rule = null;
        effectiveTargetId = null;
      }
    }

    const targetToken = tokens.find(t => Number(t.id) === Number(effectiveTargetId));
    const strength = rule ? rule.strength : 0;

    setHoveredItem({
      title: isHover ? `🔍 ${headDefinitions[activeHead].label}-Check` : `🔒 ${headDefinitions[activeHead].label}-Fokus`,
      subtitle: headDefinitions[activeHead].desc,
      data: {
        "--- Mechanik": "---",
        "QUERY_LABEL": "Query (Zentrum)",
        "QUERY_VALUE": sourceToken ? `"${sourceToken.text}" (${sourceToken.id})` : "Keine Auswahl",
        "KEY_LABEL": "Key (Ziel)",
        "KEY_VALUE": rule ? `"${targetToken?.text}" (${targetToken?.id})` : (isHover ? "Kein Fokus" : "Standby / Inaktiv"),
        "--- Mathematik": "---",
        "Attention Score": rule ? (strength * 100).toFixed(1) + "%" : "0.0%",
        "Raw Weight": strength.toFixed(4),
        "--- Erkenntnis": "---",
        "Information": rule 
          ? rule.explanation 
          : isHover 
            ? "Dieser Kopf sieht hier keine Relevanz."
            : `Für "${sourceToken?.text}" hat der ${headDefinitions[activeHead].label}-Head keine spezifischen Regeln gefunden.`
      }
    });
  }, [tokens, activeRules, setHoveredItem, sourceToken, activeHead, sourceTokenId]);

  useEffect(() => {
    updateInspector(hoveredTokenId || selectedTokenId, !!hoveredTokenId);
  }, [activeRules, hoveredTokenId, selectedTokenId, updateInspector]);

  const activeExplanation = useMemo(() => {
    const targetId = hoveredTokenId || selectedTokenId;
    if (!targetId) return null;
    let rule = activeRules.find(r => Number(r.target) === Number(targetId));
    if (!rule && targetId === selectedTokenId) {
      rule = [...activeRules].sort((a, b) => b.strength - a.strength)[0];
    }
    return rule?.explanation;
  }, [hoveredTokenId, selectedTokenId, activeRules]);

  const getHeadColor = (head, isEmo) => {
    if (isEmo) return head === 1 ? '#a855f7' : head === 2 ? '#d946ef' : head === 3 ? '#8b5cf6' : '#c084fc';
    return head === 1 ? '#3b82f6' : head === 2 ? '#06b6d4' : head === 3 ? '#2563eb' : '#22d3ee';
  };

  const isEmotional = activeProfileId?.includes('emotional') || activeProfileId?.includes('poetic');
  const themeColor = getHeadColor(activeHead, isEmotional);

  return (
    <PhaseLayout
      title="Phase 2: Self-Attention"
      subtitle="Multi-Head Interaktions-Analyse"
      theme={theme}
      badges={[
        { text: headDefinitions[activeHead].label, className: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
        { text: `Aktiv: ${activeRules.length}`, className: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
        { text: `Source: ${sourceToken?.text}`, className: "border-slate-500/30 text-slate-500 bg-white/5" }
      ]}
      visualization={
        <div className="relative w-full h-[450px] lg:h-full flex items-center justify-center overflow-hidden bg-slate-950/20 rounded-2xl" 
             onClick={() => { setSelectedTokenId(null); setHoveredTokenId(null); }}>
          
          <div className="relative h-[90%] aspect-square">
            <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
              <defs>
                <filter id="glowAtt"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              {tokens.map((token, i) => {
                if (Number(token.id) === Number(sourceTokenId)) return null;
                const angle = (i / tokens.length) * 2 * Math.PI - Math.PI / 2;
                const tx = center + Math.cos(angle) * radius;
                const ty = center + Math.sin(angle) * radius;
                const rule = activeRules.find(r => Number(r.target) === Number(token.id));
                const strength = rule ? rule.strength : 0;
                return (
                  <g key={`line-${token.id}`}>
                    <line x1={center} y1={center} x2={tx} y2={ty} stroke="currentColor" className="text-slate-800" strokeWidth="0.5" strokeDasharray="2 4" />
                    {strength > 0.01 && (
                      <>
                        <line x1={center} y1={center} x2={tx} y2={ty} stroke={themeColor} strokeWidth={1 + strength * 6} opacity={0.2 + strength * 0.6} style={{ filter: 'url(#glowAtt)' }} className="transition-all duration-500" />
                        <circle r={1.5 + strength * 1.5} fill="white">
                          <animateMotion dur={`${2.5 - strength * 2}s`} repeatCount="indefinite" path={`M ${tx} ${ty} L ${center} ${center}`} />
                        </circle>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
            <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
              {tokens.map((token, i) => {
                const isCenter = Number(token.id) === Number(sourceTokenId);
                const angle = (i / tokens.length) * 2 * Math.PI - Math.PI / 2;
                const xPos = isCenter ? 50 : (50 + (Math.cos(angle) * (radius / size * 100)));
                const yPos = isCenter ? 50 : (50 + (Math.sin(angle) * (radius / size * 100)));
                const rule = activeRules.find(r => Number(r.target) === Number(token.id));
                const strength = rule ? rule.strength : 0;

                // NEU: Prüfen, ob dieses Token im aktuellen Head aktiv ist
                const hasActivity = tokensWithActivityInHead.has(Number(token.id));

                // Dynamisches Styling für die Token-Pille
                let tokenClasses = "px-2 py-0.5 rounded border-2 font-mono text-[9px] font-bold transition-all cursor-pointer ";
                let tokenStyle = {};

                if (strength > 0.1) {
                  // Fall 1: Volle Interaktion (Hover/Klick) -> Hell & Groß
                  tokenClasses += 'bg-slate-900 border-white text-white scale-110 shadow-lg';
                } else if (hasActivity && !isCenter) {
                  // Fall 2: Subtle Hint (Aktiv im Head, aber nicht fokussiert) -> Farbiger Schimmer
                  tokenClasses += 'bg-slate-950/80 text-slate-300 hover:border-slate-300 hover:text-white';
                  tokenStyle = { borderColor: `${themeColor}60`, boxShadow: `0 0 12px ${themeColor}30` };
                } else {
                  // Fall 3: Inaktiv -> Dunkel & Grau
                  tokenClasses += 'bg-slate-950/90 border-slate-800 text-slate-600 hover:border-slate-500';
                }

                return (
                  <div key={`token-pill-${token.id}`} className="absolute pointer-events-auto transition-all duration-700 ease-in-out"
                    style={{ left: `${xPos}%`, top: `${yPos}%`, transform: 'translate(-50%, -50%)', zIndex: isCenter ? 30 : 20 }}>
                    {isCenter ? (
                      <div className="flex flex-col items-center translate-y-[-5px]">
                        <span className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: themeColor }}>Query</span>
                        <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center bg-slate-900 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-700" 
                          style={{ borderColor: themeColor }}>
                          <span className="text-white font-black text-[10px] uppercase tracking-tighter px-2 text-center leading-tight">{token.text}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group flex flex-col items-center">
                        <span className="absolute -top-3 text-[7px] text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Key</span>
                        <div 
                          onMouseEnter={() => setHoveredTokenId(token.id)}
                          onMouseLeave={() => setHoveredTokenId(null)}
                          onClick={(e) => { e.stopPropagation(); setSelectedTokenId(token.id); }}
                          className={tokenClasses}
                          style={tokenStyle}
                        >
                          {token.text}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {activeExplanation && (
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300 z-50">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-none animate-pulse" style={{ backgroundColor: themeColor }}></div>
                <div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Context Insight</div>
                  <p className="text-[10px] text-slate-200 leading-relaxed font-medium italic">{activeExplanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      }
      controls={[
        <div key="heads-ctrl" className="flex flex-col gap-2">
          <span className="text-[8px] font-black uppercase tracking-widest text-blue-500/80">Multi-Head Specialization</span>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(h => (
              <button 
                key={h} 
                onClick={() => setActiveHead(h)} 
                className={`relative h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-300 border ${
                  activeHead === h ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-tighter">{headDefinitions[h].label}</span>
                <span className="text-[7px] opacity-60 font-medium">Head #{h}</span>
                
                {headStats[h] > 0 && (
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow-lg animate-in zoom-in duration-300 ${
                    activeHead === h ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                  }`}>
                    {headStats[h]}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>,
        <div key="profiles-ctrl" className="flex flex-col gap-2 md:border-l md:border-white/10 md:pl-6">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Kontext-Layer (Inferenz)</span>
          <div className="grid grid-cols-2 gap-2">
            {profiles.map(p => (
              <button key={p.id} onClick={() => { setSelectedTokenId(null); setActiveProfileId(p.id); setHoveredTokenId(null); }} className={`h-10 px-4 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 ${activeProfileId === p.id ? 'bg-white/10 border-white/40 text-white shadow-inner' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                <div className={`w-1.5 h-1.5 rounded-full flex-none ${activeProfileId === p.id ? (p.id.includes('emotional') ? 'bg-purple-500 animate-pulse' : 'bg-blue-500 animate-pulse') : 'bg-slate-700'}`} />
                <span className="truncate">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      ]}
    />
  );
};

export default Phase2_Attention;