# Szenario-Dokumentation: Halluzinations-Labor (Limits of Logic)

## 1. Übersicht & Didaktik

**ID:** `hallucination-lab-001`

**Prompt:** *"Die Hauptstadt von Frankreich ist"*

### Lernziel

Dieses Szenario demonstriert den **Bruch der vertikalen Kausalität**. Es zeigt, wie extremes Rauschen (Noise) in der Attention-Phase und eine hohe Temperatur im Decoder dazu führen, dass das Modell den faktischen Pfad verlässt. Der Nutzer lernt, dass Halluzinationen keine „Lügen“ sind, sondern das Ergebnis mathematischer Instabilität (hoher Entropie).

## 2. Technische Logik: Die Kausalitäts-Brücke

Um den Effekt des „Wegdriftens“ von Fakten zu simulieren, nutzt dieses Szenario die Logit-Bias-Formel, wobei hier die Kategorie „Zufall/Nonsense“ bei hohem Noise-Level künstlich bevorzugt wird:

* : Die Aktivierung der Nonsense-Kategorie in Phase 3 (getriggert durch den Noise-Head in Phase 2).
* : Der resultierende Bias, der absurde Token im Decoder nach vorne schiebt.
* **Instabilitäts-Faktor:** In diesem Szenario ist der Noise-Parameter in Phase 4 mit dem Jitter-Effekt der UI gekoppelt.

## 3. Vollständiges Szenario-JSON (`scenarios.json`)

```json
{
  "id": "hallucination-lab-001",
  "name": "Halluzinations-Labor: Der Logik-Verlust",
  "input_prompt": "Die Hauptstadt von Frankreich ist",
  "explanation": "Dieses Szenario zeigt, wie extremes Rauschen in Phase 2 und 4 dazu führt, dass das Modell trotz korrekter Tokenisierung den faktischen Pfad verlässt.",
  "phase_0_tokenization": {
    "tokens": [
      { "id": 0, "text": "Die", "explanation": "Artikel (Neutral)" },
      { "id": 1, "text": "Hauptstadt", "explanation": "Semantischer Anker für Geographie." },
      { "id": 2, "text": "von", "explanation": "Relationale Präposition." },
      { "id": 3, "text": "Frankreich", "explanation": "Ziel-Entität (Faktisches Wissen)." },
      { "id": 4, "text": "ist", "explanation": "Kopula (Leitet die Antwort ein)." }
    ]
  },
  "phase_1_embedding": {
    "token_vectors": [
      { "token_index": 0, "base_vector": [0.1, 0.2], "positional_vector": [0.0, 0.1] },
      { "token_index": 1, "base_vector": [0.8, 0.9], "positional_vector": [0.1, 0.1] },
      { "token_index": 2, "base_vector": [0.2, 0.3], "positional_vector": [0.2, 0.1] },
      { "token_index": 3, "base_vector": [0.9, 0.7], "positional_vector": [0.3, 0.1] },
      { "token_index": 4, "base_vector": [0.4, 0.5], "positional_vector": [0.4, 0.1] }
    ]
  },
  "phase_2_attention": {
    "attention_profiles": [
      {
        "id": "entropy-mode",
        "label": "Kontext: Hohes Rauschen",
        "rules": [
          {
            "head": 1, "source": 4, "target": 3, "strength": 0.15,
            "explanation": "Logik-Head: Zu schwach, um die Verbindung zu 'Frankreich' zu halten."
          },
          {
            "head": 3, "source": 4, "target": 0, "strength": 0.85,
            "explanation": "Noise-Head: Zieht die Aufmerksamkeit auf statistisch irrelevante Token."
          }
        ]
      },
      {
        "id": "factual-mode",
        "label": "Kontext: Faktische Präzision",
        "rules": [
          {
            "head": 1, "source": 4, "target": 3, "strength": 0.95,
            "explanation": "Logik-Head: Starke Bindung zwischen 'ist' und 'Frankreich'."
          }
        ]
      }
    ]
  },
  "phase_3_ffn": {
    "activation_profiles": [
      {
        "ref_profile_id": "entropy-mode",
        "activations": [
          { "label": "Zufall/Nonsense", "activation": 0.92, "color": "#F97316" },
          { "label": "Geographie", "activation": 0.10, "color": "#3B82F6" },
          { "label": "Abstrakt", "activation": 0.30, "color": "#A855F7" }
        ]
      },
      {
        "ref_profile_id": "factual-mode",
        "activations": [
          { "label": "Geographie", "activation": 0.95, "color": "#3B82F6" },
          { "label": "Zufall/Nonsense", "activation": 0.05, "color": "#F97316" }
        ]
      }
    ]
  },
  "phase_4_decoding": {
    "outputs": [
      {
        "label": "Paris",
        "logit": 2.1,
        "type": "Geographie",
        "causality_trace": "Eigentlich korrekt, wird aber durch Noise unterdrückt."
      },
      {
        "label": "Bananen-Republik",
        "logit": 8.5,
        "type": "Zufall/Nonsense",
        "causality_trace": "Gewinnt durch massiven Logit-Bias aus der Nonsense-Aktivierung."
      },
      {
        "label": "blau",
        "logit": 4.2,
        "type": "Abstrakt",
        "causality_trace": "Assoziative Halluzination (Farbe der Flagge)."
      }
    ]
  }
}

```

## 4. Test-Szenarien & Erwartetes Verhalten

| Testfall | UI-Eingriff (Phase 2) | Effekt (Phase 3) | Vorhersage (Phase 4) | Didaktischer Fokus |
| --- | --- | --- | --- | --- |
| **A: Faktencheck** | Logic-Head auf **1.0** | Geographie > 90% | **Paris** (🎯) | System arbeitet im Normalzustand. |
| **B: Der Drift** | Noise-Head auf **0.9** | Nonsense > 80% | **Bananen-Republik** | Wie Rauschen Fakten verdrängt. |
| **C: Maximale Entropie** | Temp auf **1.8** + Noise | Diffuse Verteilung | **🥴 Jitter-Effekt** | Visualisierung des totalen Logik-Zusammenbruchs. |

## 5. UI/UX Dokumentation

* **Entropy-Visualizer:** Bei Auswahl des `entropy-mode` wird ein Glitch-Shader über Phase 2 und 3 gelegt, um die Instabilität visuell zu untermalen.
* **🥴 Halluzinations-Icon:** Erscheint in Phase 4 neben dem Token, wenn das `hallucination_risk` (berechnet aus der Differenz zwischen Top-1 und Top-2 Logit bei hoher Temp)  liegt.
* **Kausalitäts-Warnung:** Ein Infotext in Phase 5 erklärt: *"Die vertikale Kausalität ist unterbrochen: Phase 2 (Attention) lieferte keine stabile Basis für Phase 3 (FFN)."*
