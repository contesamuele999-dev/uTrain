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
      text: `Ciao ${settings.userName || 'Campione'}! Sono il tuo AI Coach personale uTrain. Come posso aiutarti oggi? Posso consigliarti sui carichi, stalli, tecnica o alimentazione.`,
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
    'Come superare uno stallo sulla Panca?',
    'Quando programmare una settimana di deload?',
    'Qual è il range di ripetizioni per massa?',
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
      padding: '8px',
    }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 560,
          height: '88vh',
          maxHeight: 700,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(18, 21, 30, 0.95) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Bot size={16} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                AI Coach Personale
              </h3>
              <p style={{ fontSize: '0.68rem', color: '#c4b5fd', margin: 0 }}>
                Powered by Google Gemini Flash Lite
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
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
                  gap: 2,
                }}
              >
                <div style={{
                  maxWidth: '90%',
                  padding: '8px 12px',
                  borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: isUser
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'var(--bg-input)',
                  color: isUser ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.84rem',
                  lineHeight: 1.4,
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>

                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', padding: '0 2px' }}>
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c4b5fd', fontSize: '0.78rem', padding: '6px' }}>
              <Sparkles size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
              Il Coach sta elaborando...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Carousel */}
        <div style={{
          padding: '6px 12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 4,
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
                padding: '3px 8px',
                fontSize: '0.7rem',
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
            padding: '8px 12px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 6,
            background: 'var(--bg-card)',
          }}
        >
          <input
            type="text"
            placeholder="Chiedi su carichi, tecnica, recupero..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1, fontSize: '0.84rem', padding: '6px 10px' }}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="btn-ai"
            style={{ padding: '0 12px' }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
