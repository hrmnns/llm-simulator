import React, { useState, useMemo, useEffect } from 'react';
import PhaseLayout from './../PhaseLayout';

const Phase3_FFN = ({ simulator, setHoveredItem, theme, activeScenario }) => {
  const { mlpThreshold, setMlpThreshold, activeFFN, activeAttention, activeProfileId, headOverrides, sourceTokenId } = simulator;
  const [selectedLabel, setSelectedLabel] = useState(null);

  const pipelineSignal = activeAttention?.avgSignal || 1.0;
  const isDegraded = pipelineSignal < 0.7;
  const isCritical = pipelineSignal < 0.4;

  const processedFFN = useMemo(() => {
    if (!activeFFN) return [];

    const getActiveHeadSignal = (headNum) => {
      // 1. Suche den Slider-Wert mit maximaler Toleranz
      // Wir suchen erst den spezifischen Key, dann einen Fallback
      const specificKey = `${activeProfileId}_s${sourceTokenId}_h${headNum}`;

      // Falls der spezifische Token-Key nicht da ist, suchen wir IRGENDEINEN Wert 
      // für diesen Head im aktuellen Profil (Loose Matching)
      const looseKeyPart = `_h${headNum}`;
      const looseMatch = Object.entries(headOverrides || {}).find(([key]) =>
        key.startsWith(activeProfileId) && key.endsWith(looseKeyPart)
      );

      const slider = headOverrides?.[specificKey] ?? (looseMatch ? parseFloat(looseMatch[1]) : 0.7);
      const sliderFactor = slider / 0.7;

      // 2. Regeln suchen (Robustheit bei ID-Typen)
      const rules = activeAttention?.rules?.filter(r =>
        String(r.source) === String(sourceTokenId) && Number(r.head) === Number(headNum)
      ) || [];

      // 3. Signal-Berechnung mit "Torque-Upgrade"
      // Wir nehmen 0.30 als Basis-Resonanz, damit der Slider immer eine Wirkung hat
      const rulesSum = rules.length > 0
        ? rules.reduce((acc, r) => acc + parseFloat(r.strength), 0)
        : 0.30;

      return Math.min(1.5, rulesSum * sliderFactor);
    };

    const sLogik = getActiveHeadSignal(3);
    const sStruktur = getActiveHeadSignal(4);
    const sSemantik = getActiveHeadSignal(1);
    const sSyntax = getActiveHeadSignal(2);

    return activeFFN.map(cat => {
      const label = (cat.label || "").toLowerCase();
      let factor = 1.0;
      let debugVal = 0.7;

      if (label.includes("geographie") || label.includes("fakten") || label.includes("funktional")) {
        factor = sLogik;
        debugVal = sLogik;
      }
      else if (label.includes("nonsense") || label.includes("zufall")) {
        factor = sStruktur;
        debugVal = sStruktur;
      }
      else if (label.includes("wissenschaft")) {
        factor = (sSemantik + sSyntax) / 2;
        debugVal = sSemantik;
      }
      else if (label.includes("sozial")) {
        factor = sSemantik;
        debugVal = sSemantik;
      }

      const baseVal = cat.activation || 0;
      const finalVal = Math.max(0, Math.min(1.0, baseVal * factor));

      return {
        ...cat,
        activation: finalVal,
        isActuallyActive: finalVal >= mlpThreshold,
        currentWeight: factor,
        debugHeadVal: debugVal
      };
    });
  }, [activeFFN, activeAttention, sourceTokenId, headOverrides, activeProfileId, mlpThreshold]);

  const getInspectorData = (cat) => ({
    title: `🧠 Wissens-Extraktion: ${cat.label}`,
    subtitle: `Resonanz auf Phase 2 Heads`,
    data: {
      "--- Mechanik": "---",
      "Status": cat.isActuallyActive ? "AKTIVIERT" : "UNTERDRÜCKT",
      "Signal-Stärke": cat.debugHeadVal.toFixed(2),
      "Berechneter Faktor": cat.currentWeight?.toFixed(2),
      "--- Mathematik": "---",
      "Netz-Spannung": (cat.activation * 100).toFixed(1) + "%",
      "MLP-Gate": mlpThreshold.toFixed(2)
    }
  });

  const activeCategory = useMemo(() => {
    const active = [...processedFFN].sort((a, b) => b.activation - a.activation)[0];
    return (active && active.activation >= mlpThreshold) ? active.label : "Keine Dominanz";
  }, [processedFFN, mlpThreshold]);

  useEffect(() => {
    if (selectedLabel) {
      const cat = processedFFN.find(c => c.label === selectedLabel);
      if (cat) setHoveredItem(getInspectorData(cat));
    }
  }, [processedFFN, mlpThreshold, selectedLabel]);

  return (
    <PhaseLayout
      title="Phase 3: FFN Knowledge Mapping"
      subtitle="Mustererkennung & Kategorisierung"
      theme={theme}
      badges={[
        { text: `Fokus: ${activeCategory}`, className: isCritical ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400" },
        { text: `Signal: ${(pipelineSignal * 100).toFixed(0)}%`, className: isDegraded ? "text-orange-400" : "text-slate-500" }
      ]}
      visualization={
        <div className="w-full h-full flex flex-col justify-center items-center py-4" onClick={() => { setSelectedLabel(null); setHoveredItem(null); }}>
          {isCritical && (
            <div className="absolute top-4 text-[10px] font-black text-red-500 animate-pulse z-50 uppercase tracking-widest">
              ⚠️ High Entropy Interference - Neural Mapping Unstable
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-6 relative">
            {processedFFN.map((cat) => {
              const isSelected = selectedLabel === cat.label;
              const baseColor = cat.color || "#3b82f6";
              const glitchClass = isCritical && cat.isActuallyActive ? "animate-pulse skew-x-1" : "";
              const dynamicStyles = {
                borderColor: !cat.isActuallyActive ? (theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.05)') : baseColor,
                backgroundColor: !cat.isActuallyActive ? (theme === 'light' ? '#f8fafc' : 'rgba(15, 23, 42, 0.4)') : `${baseColor}15`,
                color: !cat.isActuallyActive ? (theme === 'light' ? '#cbd5e1' : 'rgba(255,255,255,0.2)') : baseColor,
                boxShadow: cat.isActuallyActive ? `0 10px 15px -3px ${baseColor}33` : 'none'
              };
              return (
                <div key={cat.label} style={dynamicStyles}
                  onMouseEnter={() => !selectedLabel && setHoveredItem(getInspectorData(cat))}
                  onMouseLeave={() => !selectedLabel && setHoveredItem(null)}
                  className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-500 cursor-pointer overflow-hidden ${isSelected ? 'ring-2 ring-blue-500 scale-105 z-20' : 'z-10'} ${glitchClass}`}
                  onClick={(e) => { e.stopPropagation(); setSelectedLabel(isSelected ? null : cat.label); }}
                >
                  <div className="absolute bottom-0 left-0 w-full transition-all duration-1000 opacity-10 pointer-events-none"
                    style={{ height: `${cat.activation * 100}%`, backgroundColor: 'currentColor' }} />
                  <div className="z-10 text-[10px] font-black uppercase tracking-widest text-center px-2">{cat.label}</div>
                  <div className="z-10 text-[9px] font-mono mt-2 opacity-60">{(cat.activation * 100).toFixed(0)}% Active</div>
                  {cat.isActuallyActive && (
                    <div className="absolute top-4 right-4 text-xl">
                      {cat.label.includes("Geographie") && "🌍"}
                      {cat.label.includes("Wissenschaft") && "🔬"}
                      {cat.label.includes("Funktional") && "⚙️"}
                      {cat.label.includes("Sozial") && "🤝"}
                      {cat.label.includes("Nonsense") && "🥴"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      }
      controls={
        <div className="col-span-full px-6 py-4 bg-slate-900/80 rounded-xl border border-white/5 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3">
            <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest">MLP Filter (Threshold)</label>
            <div className="text-sm font-mono font-black text-blue-400">{mlpThreshold.toFixed(2)}</div>
          </div>
          <input type="range" min="0" max="1" step="0.01" value={mlpThreshold} onChange={(e) => setMlpThreshold(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
        </div>
      }
    />
  );
};

export default Phase3_FFN;