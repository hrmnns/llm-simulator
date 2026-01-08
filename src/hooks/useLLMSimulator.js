import { useState, useMemo } from 'react';

export const useLLMSimulator = (activeScenario) => {
  const [noise, setNoise] = useState(0);
  const [temperature, setTemperature] = useState(1.0);
  const [activeProfileId, setActiveProfileId] = useState('scientific');
  const [mlpThreshold, setMlpThreshold] = useState(0.5);
  const [positionWeight, setPositionWeight] = useState(0);

  const processedVectors = useMemo(() => {
    if (!activeScenario?.phase_1_embedding) return [];
    return activeScenario.phase_1_embedding.token_vectors.map(v => {
      const xBase = v.base_vector[0];
      const yBase = v.base_vector[1];
      const xPos = v.positional_vector[0];
      const yPos = v.positional_vector[1];
      const xCombined = xBase + (xPos * positionWeight);
      const yCombined = yBase + (yPos * positionWeight);
      return {
        ...v,
        displayX: (xCombined * 150) + (Math.random() - 0.5) * noise * 25,
        displayY: (yCombined * 150) + (Math.random() - 0.5) * noise * 25
      };
    });
  }, [activeScenario, noise, positionWeight]);

  const activeFFN = useMemo(() => {
    if (!activeScenario?.phase_3_ffn?.activation_profiles) return [];

    // 1. Versuch: Finde das aktuell gewählte Profil (z.B. 'scientific')
    let profile = activeScenario.phase_3_ffn.activation_profiles.find(
      p => String(p.ref_profile_id).toLowerCase() === String(activeProfileId).toLowerCase()
    );

    // 2. Fallback: Wenn 'scientific' im neuen Szenario nicht existiert, nimm einfach das erste verfügbare
    if (!profile && activeScenario.phase_3_ffn.activation_profiles.length > 0) {
      profile = activeScenario.phase_3_ffn.activation_profiles[0];
    }

    if (!profile) return [];

    return profile.activations.map(a => ({
      ...a,
      isActive: a.activation >= mlpThreshold
    }));
  }, [activeScenario, activeProfileId, mlpThreshold]);

  const finalOutputs = useMemo(() => {
    if (!activeScenario?.phase_4_decoding) return [];
    const outputs = activeScenario.phase_4_decoding.outputs;
    const exponents = outputs.map(o => Math.exp(o.logit / Math.max(temperature, 0.01)));
    const sumExponents = exponents.reduce((a, b) => a + b, 0);
    return outputs.map((o, i) => ({
      ...o,
      probability: exponents[i] / sumExponents,
      isCritical: o.hallucination_risk > 0.7 && (noise > 2.5 || temperature > 1.4)
    }));
  }, [activeScenario, temperature, noise]);

  // WICHTIG: Hier müssen alle Variablen rein!
  return {
    phase_0_tokenization: activeScenario?.phase_0_tokenization,

    processedVectors,
    activeFFN,
    finalOutputs,
    noise,
    setNoise,
    temperature,
    setTemperature,
    activeProfileId,
    setActiveProfileId,
    mlpThreshold,
    setMlpThreshold,
    positionWeight,
    setPositionWeight
  };
};