import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Bot,
  Sparkles,
  Send,
} from 'lucide-react';
import { GeminiService } from '../../services/gemini';
import { StorageService } from '../../services/storage';

interface AICoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const AICoachDrawer: React.FC<AICoachDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const settings = StorageService.getSettings();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Ciao ${settings.userName || 'Campione'}! Sono il tuo AI Coach personale di uTrain. 
Come posso aiutarti oggi? Posso analizzare la tua progressione di carico, suggerirti come superare uno stallo, spiegarti la tecnica ideale o darti consigli sul recupero.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    'Come superare uno stallo sulla Panca Piana?',
    'Quando dovrei programmare una settimana di scarico (deload)?',
    'Qual è il range di ripetizioni ideale per l\'ipertrofia?',
    'Come impostare il timing dei pasti pre e post allenamento?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Gather context
      const sessions = StorageService.getSessions();
      const prs = StorageService.getPRs();
      const activeRoutine = StorageService.getRoutines().find((r) => r.id === settings.activeRoutineId);

      const contextSummary = `Atleta: ${settings.userName}, Livello: ${settings.experienceLevel}. Scheda attiva: ${activeRoutine?.title || 'Nessuna'}. PR registrati: ${Object.values(prs).map((p) => `${p.exerciseName}: ${p.maxWeight}kg`).join(', ') || 'Nessuno'}. Sessioni totali: ${sessions.length}.`;

      const responseText = await GeminiService.chatWithCoach(
        [
          ...messages.map((m) => ({ role: m.role, text: m.text })),
          { role: 'user', text: query },
        ],
        contextSummary
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: unknown) {
      const err = e as Error;
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'model',
          text: `Errore nella risposta: ${err.message || 'Riprova tra poco.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 10, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 620,
          height: '85vh',
          maxHeight: 750,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(139, 92, 246, 0.2)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(18, 21, 30, 0.95) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(139, 92, 246, 0.4)',
            }}>
              <Bot size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                AI Coach Personale
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#c4b5fd', margin: 0 }}>
                Powered by Google Gemini (Free Tier Integrato)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  gap: 4,
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  background: isUser
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'var(--bg-input)',
                  color: isUser ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>

                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0 4px' }}>
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c4b5fd', fontSize: '0.82rem', padding: '8px' }}>
              <Sparkles size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
              Il Coach sta elaborando la risposta scientifica...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Carousel */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          background: 'rgba(9, 10, 15, 0.4)',
        }}>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 8,
            background: 'var(--bg-card)',
          }}
        >
          <input
            type="text"
            placeholder="Chiedi qualsiasi cosa su allenamento, carichi, tecnica..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1 }}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="btn-ai"
            style={{ padding: '0 16px' }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
