import { StorageService } from './storage';
import { AI_CONFIG } from '../config/aiConfig';
import type {
  AIRoutineGeneratorRequest,
  AIRoutineGeneratorResponse,
  AIWorkoutAnalysisRequest,
  AIOverloadAdvice,
} from '../types/gemini';

export class GeminiService {
  /**
   * Recupera la chiave API attiva:
   * Priorità 1: Chiave configurata in locale nelle Impostazioni (override opzionale)
   * Priorità 2: Variabile d'ambiente VITE_GEMINI_API_KEY
   * Priorità 3: Chiave fissa predefinita in AI_CONFIG
   */
  static getApiKey(): string {
    const userKey = StorageService.getSettings().geminiApiKey?.trim();
    if (userKey) return userKey;

    const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string)?.trim();
    if (envKey) return envKey;

    return AI_CONFIG.DEFAULT_API_KEY?.trim() || '';
  }

  static isKeyConfigured(): boolean {
    return !!this.getApiKey();
  }

  private static getModel(): string {
    const settings = StorageService.getSettings();
    return settings.geminiModel || AI_CONFIG.DEFAULT_MODEL || 'gemini-3.5-flash';
  }

  /**
   * Effettua una chiamata diretta all'endpoint REST di Google Gemini (Free Tier)
   */
  private static async callGeminiRaw(
    prompt: string,
    systemInstruction?: string,
    responseJson: boolean = false
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(
        'Nessuna chiave API Gemini impostata. Inseriscila nel file .env o nelle impostazioni.'
      );
    }

    const model = this.getModel();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const bodyPayload: Record<string, unknown> = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 3500,
        responseMimeType: responseJson ? 'application/json' : 'text/plain',
      },
    };

    if (systemInstruction) {
      bodyPayload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData?.error?.message ||
        `Errore API Google Gemini (${response.status}: ${response.statusText})`;
      
      if (response.status === 400 && errorMsg.includes('API_KEY_INVALID')) {
        throw new Error('Chiave API Google Gemini non valida.');
      }
      if (response.status === 429) {
        throw new Error('Limite di richieste raggiunto per questo minuto. Attendi qualche istante e riprova.');
      }
      throw new Error(errorMsg);
    }

    const json = await response.json();
    const candidates = json?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('Nessuna risposta generata dal modello Gemini.');
    }

    const text = candidates[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Risposta vuota da Gemini.');
    }

    return text;
  }

  /**
   * Test rapido validità chiave API
   */
  static async testApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const model = this.getModel();
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Rispondi solo con la parola "OK".' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          message: err?.error?.message || `Errore HTTP ${res.status}`,
        };
      }

      return { success: true, message: 'Chiave API verificata con successo!' };
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, message: err.message || 'Errore di connessione a Google AI Studio' };
    }
  }

  /**
   * Genera una scheda di allenamento personalizzata completa
   */
  static async generateWorkoutRoutine(
    req: AIRoutineGeneratorRequest
  ): Promise<AIRoutineGeneratorResponse> {
    const systemPrompt = `Sei un Master Coach di Scienza dell'Esercizio, Bodybuilding e Strength & Conditioning.
Il tuo compito è creare una scheda di allenamento scientifica, efficace, con volume bilanciato e gestione della fatica ottimale.
DEVI restituire ESCLUSIVAMENTE un oggetto JSON valido (senza markdown wrapper) che rispetti la seguente struttura:

{
  "title": "Titolo accattivante della scheda (es. Hypertrophy Precision PPL)",
  "description": "Descrizione sintetica dello scopo e logica di programmazione",
  "goalExplanation": "Spiegazione scientifica di perché questa suddivisione è perfetta per l'utente",
  "weeklyStrategyTip": "Consiglio pratico su recupero, alimentazione o progressione",
  "days": [
    {
      "dayName": "Nome del giorno (es. Giorno 1: Push (Focus Pettorali e Spalle))",
      "focus": "Focus muscolare primario",
      "exercises": [
        {
          "name": "Nome esercizio chiaro in italiano",
          "muscleGroup": "uno tra: chest | back | quads | hamstrings | glutes | calves | shoulders | biceps | triceps | forearms | core | cardio",
          "sets": 3,
          "repsMin": 8,
          "repsMax": 10,
          "targetRpe": 8,
          "restSeconds": 90,
          "notes": "Consiglio tecnico specifico"
        }
      ]
    }
  ]
}`;

    const userPrompt = `Crea una scheda di allenamento con i seguenti parametri:
- Obiettivo principale: ${req.goal}
- Livello atleta: ${req.level}
- Frequenza settimanale: ${req.daysPerWeek} giorni a settimana
- Preferenza Split: ${req.splitPreference || 'auto (decidi la migliore struttura per la frequenza richiesta)'}
- Attrezzatura a disposizione: ${req.equipment.join(', ')}
- Durata target per sessione: ${req.sessionDurationMinutes} minuti
- Focus muscolare speciale: ${req.focusMuscles?.length ? req.focusMuscles.join(', ') : 'Bilanciato per tutto il corpo'}
- Eventuali infortuni / limitazioni articolari: ${req.injuriesOrLimitations || 'Nessuno'}
- Note aggiuntive dell'utente: ${req.userNotes || 'Nessuna'}

Crea esercizi concreti, con serie realistiche (3-5 esercizi per giorno per sessioni brevi, 5-7 per sessioni standard), range di ripetizioni coerenti con l'obiettivo e tempi di recupero precisi.`;

    const raw = await this.callGeminiRaw(userPrompt, systemPrompt, true);
    
    try {
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: AIRoutineGeneratorResponse = JSON.parse(cleaned);
      return parsed;
    } catch {
      throw new Error('Errore durante l\'elaborazione della risposta della scheda AI. Riprova con parametri differenti.');
    }
  }

  /**
   * Analisi del sovraccarico progressivo per un esercizio specifico
   */
  static async analyzeExerciseOverload(
    req: AIWorkoutAnalysisRequest
  ): Promise<AIOverloadAdvice> {
    const systemPrompt = `Sei un esperto di sovraccarico progressivo (Progressive Overload).
Analizza lo storico delle ultime sessioni dell'utente per questo esercizio e determina la migliore strategia per la prossima sessione.
Rispondi con un JSON conforme a:
{
  "action": "increase_weight" | "increase_reps" | "maintain" | "deload",
  "suggestedWeightDeltaKg": 2.5,
  "suggestedRepsDelta": 1,
  "adviceText": "Frase sintetica e d'impatto con la raccomandazione pratica",
  "rationale": "Breve spiegazione biomeccanica o di gestione fatica"
}`;

    const userPrompt = `Esercizio: ${req.exerciseName} (${req.muscleGroup})
Storico sessioni recenti:
${JSON.stringify(req.historySummary, null, 2)}

Fornisci la tua raccomandazione di progressione per il prossimo allenamento.`;

    const raw = await this.callGeminiRaw(userPrompt, systemPrompt, true);
    try {
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        action: 'maintain',
        suggestedWeightDeltaKg: 0,
        suggestedRepsDelta: 0,
        adviceText: 'Mantieni il carico attuale e punta a perfezionare la tecnica e la profondità.',
        rationale: 'Storico dati insufficiente per stimare un salto di carico sicuro.',
      };
    }
  }

  /**
   * Consiglio giornaliero rapido per la dashboard
   */
  static async getDailyCoachTip(
    experienceLevel: string,
    lastWorkoutSummary?: string
  ): Promise<string> {
    const prompt = `Fornisci un consiglio breve (massimo 2 frasi concise ed energiche, in italiano) per un atleta di livello "${experienceLevel}".
${lastWorkoutSummary ? `Ultimo allenamento completato: ${lastWorkoutSummary}.` : ''}
Il consiglio deve riguardare una chicca di nutrizione pre/post workout, sonno, tecnica di respirazione (Valsalva) o gestione del recupero.`;

    const text = await this.callGeminiRaw(prompt, 'Sei un personal trainer empatico, scientifico e motivante.', false);
    return text.trim();
  }

  /**
   * Chat interattiva con l'AI Coach
   */
  static async chatWithCoach(
    messagesHistory: Array<{ role: 'user' | 'model'; text: string }>,
    userContextInfo: string
  ): Promise<string> {
    const systemPrompt = `Sei l'AI Coach personale di uTrain. Parli in italiano in modo chiaro, motivante ed estremamente competente in biomeccanica, ipertrofia, forza e nutrizione sportiva.
Contesto utente:
${userContextInfo}

Rispondi in modo diretto, formattando con elenchi puntati se utile, senza allungare eccessivamente. Mantieni le risposte pratiche e azionabili.`;

    const conversationPrompt = messagesHistory
      .map((m) => `${m.role === 'user' ? 'Atleta' : 'Coach'}: ${m.text}`)
      .join('\n\n');

    return await this.callGeminiRaw(
      `${conversationPrompt}\n\nCoach:`,
      systemPrompt,
      false
    );
  }

  /**
   * Suggerisci esercizi alternativi (es. se la macchina in palestra è occupata)
   */
  static async suggestExerciseSubstitution(
    exerciseName: string,
    equipmentAvailable: string
  ): Promise<Array<{ name: string; reason: string }>> {
    const systemPrompt = `Sei un trainer esperto. Fornisci 3 esercizi alternativi validi a quello specificato, con la stessa stimolazione muscolare e curva di resistenza, compatibili con l'attrezzatura indicata.
Restituisci un JSON:
[
  { "name": "Nome Esercizio Alternativo", "reason": "Perché è un ottimo sostituto" }
]`;

    const userPrompt = `Esercizio da sostituire: ${exerciseName}. Attrezzatura disponibile: ${equipmentAvailable}.`;
    const raw = await this.callGeminiRaw(userPrompt, systemPrompt, true);

    try {
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return [];
    }
  }
}
