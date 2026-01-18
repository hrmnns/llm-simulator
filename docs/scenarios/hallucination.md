# Szenario-Dokumentation: Halluzinations-Labor (Limits of Logic)

## 1. Übersicht & Didaktik

**ID:** `hallucination-lab-001`

**Prompt:** *"Die Hauptstadt von Frankreich ist"*

### Lernziel

Dieses Szenario demonstriert die **vertikale Kausalität** und den **Kipppunkt der Logik**. Nutzer lernen, wie das Modell zwischen faktischer Korrektheit und strukturellem Nonsense schwankt. Es wird visualisiert, dass eine Halluzination (Bananen-Republik) dann entsteht, wenn die logische Attention-Kette (Phase 2) nicht genug Energie in die korrekte Wissens-Kategorie (Phase 3) leitet, um das MLP-Gate zu passieren.

## 2. Technische Logik: Die Kausalitäts-Brücke

Das Szenario ist so kalibriert, dass der Nutzer den Ausgang des Satzes aktiv steuern kann:

1. **Faktischer Pfad:** Head 3 (Logik) verknüpft das Verb "ist" mit dem Anker "Frankreich". Bei hoher slider-Stärke erreicht die Kategorie "Geographie" eine Aktivierung von **> 50%**, was in Phase 4 zu einem positiven Logit-Shift führt.
2. **Halluzinations-Pfad:** Bei Deaktivierung von Head 3 fällt die Aktivierung unter das **MLP-Gate (20%)**. Das Wort "Paris" wird physikalisch blockiert, und der Decoder normiert die "Bananen-Republik" auf 100%.

## 3. Vollständiges Szenario-JSON (`scenarios.json`)

```json
{
  "id": "hallucination-lab-001",
  "name": "Halluzinations-Labor: Der Logik-Verlust",
  "input_prompt": "Die Hauptstadt von Frankreich ist",
  "explanation": "Dieses Szenario demonstriert die Kausalitätskette: Wie ein starkes Attention-Signal (Phase 2) die Wissens-Kategorie (Phase 3) über den 50%-Kipppunkt hebt, um im Decoder (Phase 4) eine Fakten-Antwort gegen das Rauschen durchzusetzen.",
  "phase_0_tokenization": {
    "tokens": [
      { "id": "0", "text": "Die", "explanation": "Artikel (Neutral)" },
      { "id": "1", "text": "Hauptstadt", "explanation": "Semantischer Anker für Geographie." },
      { "id": "2", "text": "von", "explanation": "Relationale Präposition." },
      { "id": "3", "text": "Frankreich", "explanation": "Ziel-Entität (Faktisches Wissen)." },
      { "id": "4", "text": "ist", "explanation": "Kausale Query (ist -> ?)" }
    ]
  },
  "phase_1_embedding": {
    "token_vectors": [
      { "token_index": 0, "base_vector": [0.1, 0.1], "positional_vector": [0.0, 0.1] },
      { "token_index": 1, "base_vector": [0.4, 0.5], "positional_vector": [0.1, 0.1] },
      { "token_index": 2, "base_vector": [0.2, 0.2], "positional_vector": [0.2, 0.1] },
      { "token_index": 3, "base_vector": [0.8, 0.8], "positional_vector": [0.3, 0.1] },
      { "token_index": 4, "base_vector": [0.1, 0.1], "positional_vector": [0.4, 0.1] }
    ]
  },
  "phase_2_attention": {
    "attention_profiles": [
      {
        "id": "entropy-mode",
        "label": "Kontext: Instabile Logik",
        "rules": [
          {
            "head": 3,
            "source": "4",
            "target": "3",
            "strength": 0.95,
            "explanation": "Logik: Starke Kontext-Leitung zu 'Frankreich'."
          },
          {
            "head": 4,
            "source": "4",
            "target": "0",
            "strength": 0.30,
            "explanation": "Struktur: Reduziertes Grundrauschen für klarere Effekte."
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
          {
            "label": "Geographie",
            "activation": 0.80,
            "color": "#3b82f6"
          },
          {
            "label": "Zufall/Nonsense",
            "activation": 0.40,
            "color": "#f97316"
          }
        ]
      }
    ]
  },
  "phase_4_decoding": {
    "outputs": [
      {
        "label": "Paris",
        "logit": 5.0,
        "type": "Geographie",
        "causality_trace": "Wird durch Logik-Aktivierung >50% massiv verstärkt."
      },
      {
        "label": "Bananen-Republik",
        "logit": 5.0,
        "type": "Zufall/Nonsense",
        "causality_trace": "Standard-Ausgabe, sinkt bei logischem Fokus."
      }
    ]
  }
}

```

## 4. Test-Szenarien & Erwartetes Verhalten

| Testfall | UI-Eingriff (Phase 2/3) | Effekt (Phase 3) | Vorhersage (Phase 4) | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **A: Logik-Sieg** | Head 3 Slider auf **1.0** | Geographie  | **Paris** (75-90%) | Fakten setzen sich durch. |
| **B: MLP-Blockade** | Head 3 Slider auf **0.1** | Geographie  | **Bananen-Republik** | Paris wird hart gefiltert. |
| **C: Rauschen** | Temp auf **1.5** + Slider 0.7 | Diffuse Verteilung | **🎲 Wechselnd** | Modell schwankt zwischen Wahrheit und Halluzination. |

## 5. UI/UX Features des Szenarios

* **Interaktive Kausalität:** Der Nutzer kann live zusehen, wie Paris im Decoder erscheint oder verschwindet, wenn der Schwellenwert in Phase 3 die 20%-Marke unter- oder überschreitet.
* **Inspektor-Feedback:** Bei Auswahl von Paris im Decoder zeigt der Inspektor den Einfluss von "Head 3 (Logik)" und den resultierenden Logit-Shift an.
* **Resampling-Dynamik:** Bei mittleren Einstellungen (75% Paris) erlaubt der "🎲 Re-Sample" Button die Demonstration des probabilistischen Charakters – gelegentlich "gewinnt" die Bananen-Republik trotz logischer Anbindung.
