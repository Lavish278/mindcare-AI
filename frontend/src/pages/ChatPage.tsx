import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Heart, Bot, User, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWearable } from '../contexts/WearableContext';
import { useWellness } from '../contexts/WellnessContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';
import type { ChatMessage } from '../types';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { currentMode, readings } = useWearable();
  const { triggerCrisis } = useWellness();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello ${user?.display_name || 'Alex'}. I am your MindCare wellness companion. I'm currently aware of your ${currentMode} mode context and recent physiological readings. How is your mental clarity and stress level feeling right now?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([
    "I'm feeling stressed about an upcoming exam",
    "Can you guide me through a 2-minute breathing exercise?",
    "How does my wearable data tie into my mood?"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      metadata: { mode: currentMode }
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage(text, undefined, currentMode);

      if (response.safety_interception && response.safety_details) {
        triggerCrisis(response.safety_details);
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, botMsg]);
      if (response.suggested_followups && response.suggested_followups.length > 0) {
        setSuggestedFollowups(response.suggested_followups);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm listening and right here with you. It looks like our network connection had a temporary hiccup, but please feel free to continue sharing what's on your mind.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
      <DisclaimerBanner compact />

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">MindCare AI Companion</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded">Active</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Contextual Mode: <span className="font-semibold text-slate-700">{currentMode}</span> | HR: {readings?.heart_rate || 71} bpm
              </p>
            </div>
          </div>
          <button
            onClick={() => setMessages([messages[0]])}
            className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center space-x-1"
            title="Reset conversation"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-lg rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span className={`block text-[9px] mt-1.5 ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 pl-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px]">MindCare companion is reflecting...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Followups */}
        {suggestedFollowups.length > 0 && !loading && (
          <div className="px-6 py-2 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-1.5">
            {suggestedFollowups.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-full border border-slate-200 text-[11px] font-medium transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Share how you're feeling, or ask for guidance... (e.g., 'feeling overwhelmed')"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
