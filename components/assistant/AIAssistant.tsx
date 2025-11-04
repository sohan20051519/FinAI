import React, { useState, useRef, useEffect } from 'react';
import { getAssistantResponse } from '../../services/geminiService';
import { useAppState } from '../../context/AppContext';
import { ChatMessage } from '../../types';
import { PaperAirplaneIcon, UserCircleIcon, SparklesIcon } from '../icons/Icons';

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isUser 
                    ? 'bg-primary-container text-on-primary-container' 
                    : 'bg-secondary-container text-on-secondary-container'
            }`}>
                {isUser ? (
                    <UserCircleIcon className="h-5 w-5" />
                ) : (
                    <SparklesIcon className="h-5 w-5" />
                )}
            </div>
            
            {/* Message Content */}
            <div className={`flex-1 max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-3 rounded-2xl ${
                    isUser
                        ? 'bg-primary text-on-primary rounded-br-md'
                        : 'bg-surface-variant text-on-surface-variant rounded-bl-md'
                } shadow-sm`}>
                    <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{message.text}</p>
                </div>
                <span className={`text-xs text-on-surface-variant mt-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
                    {isUser ? 'You' : 'FinAI'}
                </span>
            </div>
        </div>
    );
};

const TypingIndicator: React.FC = () => (
    <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <SparklesIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 max-w-[75%]">
            <div className="bg-surface-variant text-on-surface-variant rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    </div>
);

const QuickActions: React.FC<{ onSelect: (text: string) => void }> = ({ onSelect }) => {
    const suggestions = [
        "How much did I spend this month?",
        "What are my top expense categories?",
        "Show me my spending trends",
        "How can I save more money?"
    ];

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((suggestion, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(suggestion)}
                    className="px-3 py-1.5 text-xs sm:text-sm bg-surface-variant/50 hover:bg-surface-variant text-on-surface-variant rounded-full border border-outline/20 transition-colors"
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
};

const AIAssistant: React.FC = () => {
    const { expenses, incomes, userProfile } = useAppState();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (messages.length === 0) {
            if (userProfile?.name) {
                setMessages([
                    { 
                        role: 'model', 
                        text: `Hello ${userProfile.name}! 👋 I'm your FinAI assistant. I can help you analyze your expenses, track your spending, and provide financial insights. What would you like to know?` 
                    }
                ]);
            } else {
                setMessages([
                    { 
                        role: 'model', 
                        text: 'Hello! 👋 I\'m your FinAI assistant. I can help you analyze your expenses, track your spending, and provide financial insights. What would you like to know?' 
                    }
                ]);
            }
        }
    }, [userProfile, messages.length]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = { role: 'user', text: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        const userInput = input.trim();
        setInput('');
        setLoading(true);

        try {
            const response = await getAssistantResponse(messages, expenses, incomes, userProfile, userInput);
            const modelMessage: ChatMessage = { role: 'model', text: response };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = { 
                role: 'model', 
                text: 'Sorry, I encountered an error while processing your request. Please try again or check your internet connection.' 
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleQuickAction = (text: string) => {
        setInput(text);
        inputRef.current?.focus();
    };

    const showQuickActions = messages.length === 1 && !loading;

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 flex-shrink-0">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-container flex items-center justify-center">
                        <SparklesIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-on-background">FinAI Assistant</h1>
                        <p className="text-xs sm:text-sm text-on-surface-variant">Your personal financial advisor</p>
                    </div>
                </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto bg-surface-variant/30 rounded-2xl p-4 sm:p-6 mb-4 min-h-0">
                <div className="space-y-1">
                    {messages.map((msg, index) => (
                        <MessageBubble key={index} message={msg} />
                    ))}
                    {loading && <TypingIndicator />}
                    {showQuickActions && <QuickActions onSelect={handleQuickAction} />}
                </div>
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex-shrink-0">
                <div className="flex gap-2 sm:gap-3 items-end">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask me anything about your finances..."
                            disabled={loading}
                            className="w-full bg-surface-variant/50 border border-outline/30 rounded-xl px-4 py-3 sm:py-3.5 pr-12 text-sm sm:text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 bg-primary text-on-primary rounded-xl hover:bg-primary/90 active:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform active:scale-[0.98] flex items-center justify-center"
                        aria-label="Send message"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <PaperAirplaneIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        )}
                    </button>
                </div>
                <p className="mt-2 text-xs text-on-surface-variant text-center">
                    FinAI can analyze your expenses, income, and provide financial insights
                </p>
            </form>
        </div>
    );
};

export default AIAssistant;
