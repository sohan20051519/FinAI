
import React, { useState, useRef, useEffect } from 'react';
import { getAssistantResponse } from '../../services/geminiService';
import { useAppState } from '../../context/AppContext';
import { ChatMessage } from '../../types';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { PaperAirplaneIcon, UserCircleIcon, SparklesIcon } from '../icons/Icons';

const Header: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <header className="mb-4 text-center">
        <h1 className="text-3xl md:text-4xl font-normal text-on-surface">{title}</h1>
        <p className="text-base text-on-surface-variant">{subtitle}</p>
    </header>
);

const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex items-start gap-4 my-4 ${isModel ? '' : 'flex-row-reverse'}`}>
            <div className={`p-2 rounded-full ${isModel ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}>
                {isModel ? <SparklesIcon className="h-6 w-6"/> : <UserCircleIcon className="h-6 w-6"/>}
            </div>
            <div className={`p-4 rounded-3xl max-w-lg ${isModel ? 'bg-secondary-container text-on-secondary-container rounded-bl-lg' : 'bg-primary-container text-on-primary-container rounded-br-lg'}`}>
                <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
        </div>
    );
};

const AIAssistant: React.FC = () => {
  const { expenses, incomes, userProfile } = useAppState();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial greeting when the component loads, but only if there are no messages
    // to avoid resetting a conversation.
    if (messages.length === 0) {
        if (userProfile?.name) {
            setMessages([
                { role: 'model', text: `Hello ${userProfile.name}! How can I help you with your budget today?` }
            ]);
        } else {
            setMessages([
                { role: 'model', text: 'Hello! How can I help you with your budget today?' }
            ]);
        }
    }
  }, [userProfile, messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await getAssistantResponse(messages, expenses, incomes, userProfile, input);
      const modelMessage: ChatMessage = { role: 'model', text: response };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col">
        <Header title="AI Assistant" subtitle="Ask me anything about your spending." />
        <div className="flex-1 overflow-y-auto bg-surface-variant/20 rounded-3xl p-4">
            {messages.map((msg, index) => <Message key={index} message={msg} />)}
            {loading && <div className="flex justify-center"><Spinner /></div>}
            <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="e.g., How much did I spend on groceries?"
                className="flex-1 bg-surface-variant/50 p-3 rounded-full border border-outline/30 focus:border-primary focus:ring-primary text-on-surface placeholder:text-on-surface-variant"
            />
            <Button type="submit" disabled={loading} className="!p-3">
                <PaperAirplaneIcon className="h-6 w-6"/>
            </Button>
        </form>
    </div>
  );
};

export default AIAssistant;
