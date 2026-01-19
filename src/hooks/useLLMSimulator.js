import { useState, useMemo, useEffect } from 'react';

export const useLLMSimulator = (activeScenario) => {
  const [noise, setNoise] = useState(0);
  const [temperature, setTemperature] = useState(1.0);
  const [activeProfileId, setActiveProfileId] = useState('scientific');
  const [mlpThreshold, setMlpThreshold] = useState(0.5);
  const [positionWeight, setPositionWeight] = useState(0);
  const [headOverrides, setHeadOverrides] = useState({});

  // NEU: activeFFN ist jetzt ein State, damit Phase 3 ihn beschreiben kann
  const [activeFFN, setActiveFFN] = useState([]);

  // State für die Kommunikation zwischen Phase 4 und Phase 5
  const [selectedToken, setSelectedToken] = useState(null);

  const updateHeadWeight = (key, value) => {
    setHeadOverrides(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reset Selection wenn das Szenario wechselt
  useEffect(() => {
    setSelectedToken(null);
  }, [activeScenario]);

  // --- NEU: INITIALISIERUNG DES FFN STATES ---
  useEffect(() => {
    if (!activeScenario?.phase_3_ffn?.activation_profiles) {
      setActiveFFN([]);
      return;
    }

    let profile = activeScenario.phase_3_ffn.activation_profiles.find(
      p => String(p.ref_profile_id).toLowerCase() === String(activeProfileId).toLowerCase()
    );

    if (!profile && activeScenario.phase_3_ffn.activation_profiles.length > 0) {
      profile = activeScenario.phase_3_ffn.activation_profiles[0];
    }

    if (profile) {
      const initialData = profile.activations.map(a => ({
        ...a,
        activation: a.activation || 0.5, // Startwert aus JSON
        isActive: (a.activation || 0.5) >= mlpThreshold
      }));
      setActiveFFN(initialData);
    }
  }, [activeScenario?.id, activeProfileId]); // Reset bei Szenario/Profil-Wechsel

  // 1. PHASE 1: ARBEITSVEKTOREN
  const processedVectors = useMemo(() => {
    if (!activeScenario?.phase_1_embedding) return [];

    return activeScenario.phase_1_embedding.token_vectors.map(v => {
      const xBase = v.base_vector[0];
      const yBase = v.base_vector[1];
      const xPos = (v.positional_vector?.[0] || 0) * positionWeight;
      const yPos = (v.positional_vector?.[1] || 0) * positionWeight;

      const noiseX = (Math.random() - 0.5) * noise * 25;
      const noiseY = (Math.random() - 0.5) * noise * 25;

      const finalPixelX = (xBase + xPos) * 150 + noiseX;
      const finalPixelY = (yBase + yPos) * 150 + noiseY;

      const signalQuality = Math.max(0, 1 - (noise / 5));

      return {
        ...v,
        displayXOrig: xBase * 150,
        displayYOrig: yBase * 150,
        displayX: finalPixelX,
        displayY: finalPixelY,
        x: finalPixelX / 150,
        y: finalPixelY / 150,
        signalQuality
      };
    });
  }, [activeScenario, noise, positionWeight]);

  // 2. PHASE 2 ATTENTION SUPPORT
  const activeAttention = useMemo(() => {
    if (!activeScenario?.phase_2_attention?.attention_profiles) return { avgSignal: 1.0, profiles: [] };
    const avgSignal = processedVectors.reduce((acc, v) => acc + v.signalQuality, 0) / (processedVectors.length || 1);
    return {
      avgSignal,
      profiles: activeScenario.phase_2_attention.attention_profiles
    };
  }, [activeScenario, processedVectors]);

  // 4. PHASE 4: DECODING (Reagiert auf activeFFN State)
  const finalOutputs = useMemo(() => {
    if (!activeScenario?.phase_4_decoding) return [];
    const outputs = activeScenario.phase_4_decoding.outputs;
    const noiseLevel = Math.min(1, noise / 2);

    const calculatedData = outputs.map(o => {
      const sensitivity = o.noise_sensitivity !== undefined ? o.noise_sensitivity : 0.5;
      const decayFactor = 1 - (noiseLevel * sensitivity);
      const adjustedLogit = Math.max(0.1, o.logit * decayFactor);

      return {
        ...o,
        adjustedLogit,
        exp: Math.exp(adjustedLogit / Math.max(temperature, 0.01))
      };
    });

    const sumExponents = calculatedData.reduce((acc, curr) => acc + curr.exp, 0);

    return calculatedData.map((item) => ({
      ...item,
      logit: item.adjustedLogit,
      probability: item.exp / sumExponents,
      isCritical: (item.hallucination_risk > 0.7) || (noise > 0.5 && item.noise_sensitivity > 0.8)
    }));
  }, [activeScenario, temperature, noise]);

  const resetParameters = () => {
    // 1. Physische Parameter (Phase 1)
    setNoise(0);
    setPositionWeight(1.0); // Zurück auf volle Struktur (Satzbau stabil)

    // 2. Attention-Slider & Logik (Phase 2 & 3)
    setHeadOverrides({});   // Löscht alle manuellen Slider-Bewegungen (alle zurück auf 0.7)
    setMlpThreshold(0.5);   // MLP-Gate auf Standard-Mitte

    // 3. Decoding (Phase 4)
    setTemperature(0.7);    // Zurück auf Standard-Konfidenz (statt 1.0)

    // 4. UI-State & Auswahl
    setSelectedToken(null);

    setHeadOverrides({});
    setActiveProfileId(activeScenario?.phase_2_attention?.attention_profiles[0]?.id || 'default');

    console.log("♻️ Simulator-Kern: Globaler Reset auf Standardwerte durchgeführt.");
  };

  return {
    phase_0_tokenization: activeScenario?.phase_0_tokenization,
    processedVectors,
    activeFFN,        // State aus useState
    setActiveFFN,     // Setter Funktion
    finalOutputs,
    activeAttention,
    headOverrides,
    setHeadOverrides,
    updateHeadWeight,
    noise, setNoise,
    temperature, setTemperature,
    activeProfileId, setActiveProfileId,
    mlpThreshold, setMlpThreshold,
    positionWeight, setPositionWeight,
    selectedToken, setSelectedToken,
    activeScenario, // Rückgabe des Szenarios für direkten Zugriff
    resetParameters
  };
};