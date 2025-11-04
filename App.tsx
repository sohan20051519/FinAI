
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './components/dashboard/Dashboard';
import TransactionLogger from './components/expenses/ExpenseLogger';
import Planner from './components/planner/Planner';
import AIAssistant from './components/assistant/AIAssistant';
import Reports from './components/reports/Reports';
import Onboarding from './components/onboarding/Onboarding';
import { AppProvider, useAppState } from './context/AppContext';

export type View = 'dashboard' | 'expenses' | 'planner' | 'assistant' | 'reports';

const AppContent: React.FC = () => {
  const { isOnboardingComplete } = useAppState();
  const [currentView, setCurrentView] = useState<View>('dashboard');

  if (!isOnboardingComplete) {
    return <Onboarding />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'expenses':
        return <TransactionLogger />;
      case 'planner':
        return <Planner />;
      case 'assistant':
        return <AIAssistant />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  const isAssistantView = currentView === 'assistant';

  return (
    <div className="flex h-screen w-full bg-background text-on-background">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className={`flex-1 ${isAssistantView ? 'overflow-hidden' : 'overflow-y-auto'} pb-20 md:pb-0`}>
        <div className={`p-4 sm:p-6 lg:p-8 ${isAssistantView ? 'h-full' : ''}`}>
          {renderView()}
        </div>
      </main>
      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
