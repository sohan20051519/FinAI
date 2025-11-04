
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './components/dashboard/Dashboard';
import TransactionLogger from './components/expenses/ExpenseLogger';
import Planner from './components/planner/Planner';
import AIAssistant from './components/assistant/AIAssistant';
import Reports from './components/reports/Reports';
import Onboarding from './components/onboarding/Onboarding';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import { AppProvider, useAppState, useAppDispatch } from './context/AppContext';

export type View = 'dashboard' | 'expenses' | 'planner' | 'assistant' | 'reports';

const AppContent: React.FC = () => {
  const { isOnboardingComplete, isAuthenticated } = useAppState();
  const dispatch = useAppDispatch();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);

  // Show authentication pages if not authenticated
  if (!isAuthenticated) {
    const handleSignIn = async (email: string, password: string) => {
      setIsLoading(true);
      // Simulate API call - replace with actual authentication logic
      setTimeout(() => {
        dispatch({
          type: 'SIGN_IN',
          payload: { name: email.split('@')[0], email },
        });
        setIsLoading(false);
      }, 1000);
    };

    const handleSignUp = async (name: string, email: string, password: string, confirmPassword: string) => {
      setIsLoading(true);
      // Simulate API call - replace with actual authentication logic
      setTimeout(() => {
        dispatch({
          type: 'SIGN_UP',
          payload: { name, email },
        });
        setIsLoading(false);
      }, 1000);
    };

    const handleGoogleSignIn = async () => {
      setIsLoading(true);
      // Simulate Google sign-in - replace with actual Google OAuth logic
      setTimeout(() => {
        dispatch({
          type: 'SIGN_IN',
          payload: { name: 'Google User', email: 'user@gmail.com' },
        });
        setIsLoading(false);
      }, 1000);
    };

    const handleGoogleSignUp = async () => {
      setIsLoading(true);
      // Simulate Google sign-up - replace with actual Google OAuth logic
      setTimeout(() => {
        dispatch({
          type: 'SIGN_UP',
          payload: { name: 'Google User', email: 'user@gmail.com' },
        });
        setIsLoading(false);
      }, 1000);
    };

    if (authMode === 'signin') {
      return (
        <SignIn
          onSignIn={handleSignIn}
          onGoogleSignIn={handleGoogleSignIn}
          onSwitchToSignUp={() => setAuthMode('signup')}
          isLoading={isLoading}
        />
      );
    } else {
      return (
        <SignUp
          onSignUp={handleSignUp}
          onGoogleSignUp={handleGoogleSignUp}
          onSwitchToSignIn={() => setAuthMode('signin')}
          isLoading={isLoading}
        />
      );
    }
  }

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
