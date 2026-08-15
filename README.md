# uTrain • AI Workout Tracker & Progressive Overload Coach

<div align="center">
  <h3>Web App Responsive & 100% Gratuita per Schede di Allenamento, Tracking Carichi in Sala Pesi e Analisi del Sovraccarico Progressivo</h3>
</div>

---

## 🌟 Caratteristiche Principali

- **🤖 Google Gemini AI (Free Tier)**:
  - Generatore automatico di schede scientifiche basate su obiettivo, split, giorni settimanali, attrezzatura ed eventuali infortuni.
  - Chat interattiva con l'AI Coach per superare stalli e ottimizzare il recupero.
  - Ricerca varianti ed esercizi sostitutivi se gli attrezzi in palestra sono occupati.
- **🏋️ Gym Live Tracker (Mobile-First)**:
  - Input rapido touch-friendly per carichi e ripetizioni (`+2.5kg`, `+1.25kg`, `+1 rep`).
  - **Timer di recupero offline** sintetizzato via Web Audio API con avvisi sonori e vibrazione aptica.
  - **Calcolatore Dischi Bilanciere (Plate Calculator)**: visualizza esattamente quali dischi montare per lato su bilancieri da 20kg, 15kg o EZ.
  - Calcolo automatico dei massimali stimati **1RM** (formule Brzycki & Epley).
- **📈 Grafici & Analytics**:
  - Grafico temporale 1RM e carichi massimi per esercizio (Chart.js).
  - Ripartizione del volume per gruppo muscolare.
  - Heatmap di costanza degli ultimi 35 giorni.
  - Celebrazione Personal Record con animazione confetti.
- **🔒 Privacy & Zero Costi**:
  - Nessun server o database a pagamento; tutto è memorizzato localmente su `LocalStorage`.
  - Esportazione ed importazione completa di backup in formato `.json`.

---

## 🚀 Avvio Rapido

### Metodo 1: Script Batch (Windows)
Fai doppio click su **`start.bat`** per avviare il server di sviluppo e aprire automaticamente il browser!

Per salvare e inviare le modifiche su GitHub, fai doppio click su **`push.bat`**.

---

### Metodo 2: Comandi Manuali

```bash
# 1. Installa le dipendenze
npm install

# 2. Avvia il server di sviluppo
npm run dev

# 3. Compila per la produzione
npm run build
```

---

## 🔑 Configurazione Google Gemini API (Gratis)
1. Apri la sezione **Setup / Impostazioni** nell'applicazione.
2. Clicca su **"Ottieni Chiave Gratis su Google AI Studio"** (o visita [Google AI Studio](https://aistudio.google.com/app/apikey)).
3. Genera la tua chiave gratuita personale (senza inserire carte di credito) e incollala nelle impostazioni.
