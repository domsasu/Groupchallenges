
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { getCoachResponse } from '../services/geminiService';

interface CoachProps {
  lessonTitle: string;
  isAssignment?: boolean;
  isPracticeAssignment?: boolean;
}

export const Coach: React.FC<CoachProps> = ({ lessonTitle, isAssignment, isPracticeAssignment }) => {
  const [isOpen, setIsOpen] = useState(true); // Default expanded
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'coach', text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleAsk = async (question?: string) => {
    const textToAsk = question || query;
    if (!textToAsk.trim()) return;
    
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: textToAsk }]);
    setIsLoading(true);

    try {
      const answer = await getCoachResponse(textToAsk, lessonTitle);
      setMessages(prev => [...prev, { role: 'coach', text: answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'coach', text: "Something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-[var(--cds-color-grey-50)] overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[17px] font-bold text-[var(--cds-color-grey-975)]">coach</span>
        <Icons.ChevronDown className={`w-5 h-5 text-[var(--cds-color-grey-500)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="px-6 pb-6">
           {messages.length === 0 && (
              <div>
                {isPracticeAssignment || isAssignment ? (
                    <>
                        <p className="text-[14px] text-[var(--cds-color-grey-600)] mb-4 leading-relaxed">
                          Ready to review what you've learned before starting the assignment? I'm here to help.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button 
                                onClick={() => handleAsk("Help me practice for this assignment")}
                                className="flex items-center gap-1.5 bg-[var(--cds-color-white)] border border-[#0056D2] text-[var(--cds-color-blue-700)] hover:bg-blue-50 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors"
                            >
                                <Icons.Sparkles className="w-3.5 h-3.5" />
                                Help me practice
                            </button>
                            <button 
                                onClick={() => handleAsk("Let's chat about this topic")}
                                className="flex items-center gap-1.5 bg-[var(--cds-color-white)] border border-[#0056D2] text-[var(--cds-color-blue-700)] hover:bg-blue-50 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors"
                            >
                                <Icons.Sparkles className="w-3.5 h-3.5" />
                                Let's chat
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-[14px] text-[var(--cds-color-grey-600)] mb-4 leading-relaxed">
                          Hi! I'm your AI Coach. Ask me anything about <span className="font-bold">"{lessonTitle}"</span>.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button 
                                onClick={() => handleAsk("Explain this concept to me")}
                                className="flex items-center gap-1.5 bg-[var(--cds-color-white)] border border-[#0056D2] text-[var(--cds-color-blue-700)] hover:bg-blue-50 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors"
                            >
                                <Icons.Sparkles className="w-3.5 h-3.5" />
                                Explain this
                            </button>
                            <button 
                                onClick={() => handleAsk("Let's chat about this topic")}
                                className="flex items-center gap-1.5 bg-[var(--cds-color-white)] border border-[#0056D2] text-[var(--cds-color-blue-700)] hover:bg-blue-50 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors"
                            >
                                <Icons.Sparkles className="w-3.5 h-3.5" />
                                Let's chat
                            </button>
                        </div>
                    </>
                )}
              </div>
           )}
          
          {messages.length > 0 && (
            <>
              <div className="max-h-96 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar bg-[var(--cds-color-white)] rounded-lg p-4">
                  {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${
                      msg.role === 'user' 
                          ? 'bg-[var(--cds-color-blue-700)] text-[var(--cds-color-white)] rounded-br-sm' 
                          : 'bg-[var(--cds-color-grey-25)] text-[var(--cds-color-grey-900)] rounded-bl-sm border border-[var(--cds-color-grey-50)]'
                      }`}>
                      {msg.text}
                      </div>
                  </div>
                  ))}
                  {isLoading && (
                  <div className="flex justify-start">
                      <div className="bg-[var(--cds-color-grey-25)] text-[var(--cds-color-grey-500)] px-4 py-3 rounded-2xl rounded-bl-sm text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[var(--cds-color-grey-400)] rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-[var(--cds-color-grey-400)] rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-[var(--cds-color-grey-400)] rounded-full animate-bounce delay-150"></div>
                      </div>
                  </div>
                  )}
                  <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  placeholder="Ask a question..."
                  className="flex-1 bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-200)] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0056D2]/20 focus:border-[#0056D2] placeholder-slate-400"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  onClick={() => handleAsk()}
                  disabled={isLoading || !query.trim()}
                  className="bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] px-6 py-2 rounded-lg text-[14px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ask
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
