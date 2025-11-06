import React, { useState, useRef, useEffect } from 'react';
import { getAssistantResponse } from '../../services/geminiService';
import { useAppState } from '../../context/AppContext';
import { ChatMessage } from '../../types';
import { PaperAirplaneIcon, UserCircleIcon, SparklesIcon } from '../icons/Icons';
import { supabase } from '../../lib/supabase';
import { chatMessagesService } from '../../services/supabaseService';
import { getHealthyAlternatives, getProductsByCategory, getCategories, type HealthyProductSuggestion } from '../../services/healthyProductsService';

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
                    <div className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                        {isUser ? (
                            <p>{message.text}</p>
                        ) : (
                            message.text.split('\n').map((line, idx) => {
                            // Clean up markdown formatting
                            let cleanedLine = line
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                                .replace(/###\s*(.*)/g, '<strong class="text-base">$1</strong>') // Headers
                                .replace(/##\s*(.*)/g, '<strong class="text-lg">$1</strong>')
                                .replace(/#\s*(.*)/g, '<strong class="text-xl">$1</strong>')
                                .replace(/`(.*?)`/g, '<code class="bg-black/10 px-1 py-0.5 rounded text-xs font-mono">$1</code>'); // Code
                            
                            // Handle table separators (remove them)
                            if (line.trim().match(/^[\|\s:-\|]+$/)) {
                                return null; // Don't render table separators
                            }
                            
                            // Handle table rows
                            if (line.includes('|') && !line.match(/^[\|\s:-\|]+$/)) {
                                const cells = line.split('|').filter(cell => cell.trim());
                                return (
                                    <div key={idx} className="flex gap-2 my-1">
                                        {cells.map((cell, cellIdx) => (
                                            <span key={cellIdx} className="flex-1 text-xs">
                                                {cell.trim().replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
                                            </span>
                                        ))}
                                    </div>
                                );
                            }
                            
                            return (
                                <div 
                                    key={idx} 
                                    dangerouslySetInnerHTML={{ __html: cleanedLine || '&nbsp;' }}
                                    className={idx > 0 ? 'mt-2' : ''}
                                />
                            );
                        }))}
                    </div>
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
        "How can I save more money?",
        "Suggest healthy alternatives to white salt",
        "What are better options than refined sugar?",
        "Recommend healthy cooking oils for my family"
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

const ChatHistorySidebar: React.FC<{ 
    chatSessions: Array<{ id: string; messages: ChatMessage[]; createdAt: string; updatedAt: string }>;
    onSelectSession: (sessionId: string) => void;
    currentSessionId: string | null;
    onNewSession: () => void;
}> = ({ chatSessions, onSelectSession, currentSessionId, onNewSession }) => {
    // Group sessions by date
    const groupedSessions = chatSessions.reduce((acc, session) => {
        const date = new Date(session.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        if (!acc[date]) acc[date] = [];
        
        // Get first user message as preview
        const firstUserMessage = session.messages.find(msg => msg.role === 'user');
        const preview = firstUserMessage 
            ? firstUserMessage.text.substring(0, 60) + (firstUserMessage.text.length > 60 ? '...' : '')
            : 'New conversation';
        
        acc[date].push({ 
            id: session.id, 
            preview,
            createdAt: session.createdAt,
            messageCount: session.messages.length
        });
        return acc;
    }, {} as Record<string, Array<{ id: string; preview: string; createdAt: string; messageCount: number }>>);

    return (
        <div className="w-64 bg-surface-variant/30 rounded-2xl p-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-on-surface">Chat History</h3>
                <button
                    onClick={onNewSession}
                    className="px-2 py-1 text-xs bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity"
                    title="Start new session"
                >
                    + New
                </button>
            </div>
            {Object.keys(groupedSessions).length === 0 ? (
                <p className="text-sm text-on-surface-variant">No chat history yet</p>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedSessions).map(([date, sessions]) => (
                        <div key={date}>
                            <p className="text-xs font-medium text-on-surface-variant mb-2">{date}</p>
                            <div className="space-y-2">
                                {sessions.map((session) => (
                                    <button
                                        key={session.id}
                                        onClick={() => onSelectSession(session.id)}
                                        className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                                            currentSessionId === session.id
                                                ? 'bg-primary-container text-on-primary-container'
                                                : 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant'
                                        }`}
                                        title={`${session.messageCount} messages`}
                                    >
                                        <div className="truncate">{session.preview}</div>
                                        <div className="text-xs opacity-70 mt-1">
                                            {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AIAssistant: React.FC = () => {
    const { expenses, incomes, userProfile } = useAppState();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [chatSessions, setChatSessions] = useState<Array<{ id: string; messages: ChatMessage[]; createdAt: string; updatedAt: string }>>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Always start with a new session on mount (only once)
    const [hasInitialized, setHasInitialized] = useState(false);
    useEffect(() => {
        // Only initialize once on mount
        if (!hasInitialized && messages.length === 0) {
            // Initialize with greeting for new session
            if (userProfile?.name) {
                setMessages([
                    { 
                        role: 'model', 
                        text: `Hello ${userProfile.name}! 👋 I'm your FinAI assistant. I can help you analyze your expenses, track your spending, provide financial insights, and suggest healthy product alternatives for your family. What would you like to know?` 
                    }
                ]);
            } else {
                setMessages([
                    { 
                        role: 'model', 
                        text: 'Hello! 👋 I\'m your FinAI assistant. I can help you analyze your expenses, track your spending, provide financial insights, and suggest healthy product alternatives for your family. What would you like to know?' 
                    }
                ]);
            }
            setCurrentSessionId(null); // New session, no ID yet
            setHasInitialized(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Load chat history for sidebar
    useEffect(() => {
        const loadChatHistory = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const sessions = await chatMessagesService.getAllChatSessions(user.id);
                setChatSessions(sessions);
            } catch (error) {
                console.error('Error loading chat history:', error);
            }
        };

        loadChatHistory();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = { role: 'user', text: input.trim() };
        const userInput = input.trim();
        setInput('');
        setLoading(true);

        // Add user message immediately to show it
        setMessages(prev => {
            const updated = [...prev, userMessage];
            return updated;
        });

        try {
            // Get current messages including the user message for AI context
            const currentMessages = [...messages, userMessage];
            
            // Check if the query is about healthy products
            const healthyProductKeywords = ['salt', 'sugar', 'oil', 'flour', 'rice', 'healthy', 'alternative', 'better', 'nourish', 'nutritious', 'product', 'food'];
            const isHealthyProductQuery = healthyProductKeywords.some(keyword => 
                userInput.toLowerCase().includes(keyword)
            );

            let response: string;
            if (isHealthyProductQuery) {
                // Try to get healthy product suggestions from database first
                try {
                    const alternatives = await getHealthyAlternatives(userInput);
                    if (alternatives.length > 0) {
                        // Format the response with database suggestions
                        let formattedResponse = `Here are some healthy alternatives I found:\n\n`;
                        alternatives.forEach((alt, index) => {
                            formattedResponse += `${index + 1}. **${alt.common_product}** → **${alt.healthy_alternative}**\n`;
                            formattedResponse += `   Category: ${alt.category}\n`;
                            formattedResponse += `   Health Benefits: ${alt.health_benefits}\n`;
                            if (alt.nutritional_info) {
                                formattedResponse += `   Nutritional Info: ${alt.nutritional_info}\n`;
                            }
                            formattedResponse += `   Availability: ${alt.availability}\n`;
                            if (alt.price_range) {
                                formattedResponse += `   Price Range: ${alt.price_range}\n`;
                            }
                            if (alt.brand_suggestions && alt.brand_suggestions.length > 0) {
                                formattedResponse += `   Brand Suggestions: ${alt.brand_suggestions.join(', ')}\n`;
                            }
                            formattedResponse += `\n`;
                        });
                        formattedResponse += `\nThese products are available in Indian markets and are better for your family's health. Would you like more information about any specific product?`;
                        response = formattedResponse;
                    } else {
                        // Fall back to AI response
                        response = await getAssistantResponse(currentMessages, expenses, incomes, userProfile, userInput);
                    }
                } catch (dbError) {
                    console.error('Error fetching healthy products:', dbError);
                    // Fall back to AI response
                    response = await getAssistantResponse(currentMessages, expenses, incomes, userProfile, userInput);
                }
            } else {
                // Regular financial query
                response = await getAssistantResponse(currentMessages, expenses, incomes, userProfile, userInput);
            }

            const modelMessage: ChatMessage = { role: 'model', text: response };
            // Add model response to messages
            setMessages(prev => {
                const updated = [...prev, modelMessage];
                
                // Save chat history to Supabase
                (async () => {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                            const savedSession = await chatMessagesService.saveChatMessages(
                                user.id, 
                                updated, 
                                currentSessionId || undefined
                            );
                            // Update current session ID if it's a new session
                            if (!currentSessionId && savedSession) {
                                setCurrentSessionId(savedSession.id);
                            }
                            // Reload chat sessions for history sidebar
                            const sessions = await chatMessagesService.getAllChatSessions(user.id);
                            setChatSessions(sessions);
                        }
                    } catch (saveError) {
                        console.warn('Failed to save chat history:', saveError);
                        // Don't show error to user, just log it
                    }
                })();
                
                return updated;
            });
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = { 
                role: 'model', 
                text: 'Sorry, I encountered an error while processing your request. Please try again or check your internet connection.' 
            };
            // Add error message to messages (user message already added)
            setMessages(prev => {
                const updated = [...prev, errorMessage];
                
                // Save chat history even on error
                (async () => {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                            const savedSession = await chatMessagesService.saveChatMessages(
                                user.id, 
                                updated, 
                                currentSessionId || undefined
                            );
                            if (!currentSessionId && savedSession) {
                                setCurrentSessionId(savedSession.id);
                            }
                            // Reload chat sessions for history sidebar
                            const sessions = await chatMessagesService.getAllChatSessions(user.id);
                            setChatSessions(sessions);
                        }
                    } catch (saveError) {
                        console.warn('Failed to save chat history:', saveError);
                    }
                })();
                
                return updated;
            });
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

    const handleSelectSession = async (sessionId: string) => {
        try {
            const session = await chatMessagesService.getChatSession(sessionId);
            if (session) {
                setMessages(session.messages);
                setCurrentSessionId(session.id);
                setShowHistory(false); // Close history sidebar on mobile
            }
        } catch (error) {
            console.error('Error loading session:', error);
        }
    };

    const handleNewSession = () => {
        // Initialize with greeting for new session
        if (userProfile?.name) {
            setMessages([
                { 
                    role: 'model', 
                    text: `Hello ${userProfile.name}! 👋 I'm your FinAI assistant. I can help you analyze your expenses, track your spending, provide financial insights, and suggest healthy product alternatives for your family. What would you like to know?` 
                }
            ]);
        } else {
            setMessages([
                { 
                    role: 'model', 
                    text: 'Hello! 👋 I\'m your FinAI assistant. I can help you analyze your expenses, track your spending, provide financial insights, and suggest healthy product alternatives for your family. What would you like to know?' 
                }
            ]);
        }
        setCurrentSessionId(null); // New session, no ID yet
        setShowHistory(false); // Close history sidebar on mobile
    };

    return (
        <div className="h-full flex gap-4 max-w-7xl mx-auto w-full">
            {/* Chat History Sidebar */}
            {showHistory && (
                <div className="hidden lg:block flex-shrink-0">
                    <ChatHistorySidebar
                        chatSessions={chatSessions}
                        onSelectSession={handleSelectSession}
                        currentSessionId={currentSessionId}
                        onNewSession={handleNewSession}
                    />
                </div>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 h-full flex flex-col">
                {/* Header */}
                <div className="mb-4 sm:mb-6 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-container flex items-center justify-center">
                            <SparklesIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-on-background">FinAI Assistant</h1>
                            <p className="text-xs sm:text-sm text-on-surface-variant">Your personal financial advisor</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="px-4 py-2 bg-surface-variant/50 hover:bg-surface-variant text-on-surface-variant rounded-lg transition-colors text-sm"
                    >
                        {showHistory ? 'Hide' : 'Show'} History
                    </button>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto bg-surface-variant/30 rounded-2xl p-4 sm:p-6 mb-4 min-h-0">
                <div className="space-y-1">
                    {messages.map((msg, index) => (
                        <div key={index} id={`message-${index}`}>
                            <MessageBubble message={msg} />
                        </div>
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
        </div>
    );
};

export default AIAssistant;
