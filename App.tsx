
import React, { useState, useEffect } from 'react';
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
import { supabase } from './lib/supabase';
import { userProfileService, fixedExpensesService, expensesService, incomesService } from './services/supabaseService';

export type View = 'dashboard' | 'expenses' | 'planner' | 'assistant' | 'reports';

const AppContent: React.FC = () => {
  const { isOnboardingComplete, isAuthenticated } = useAppState();
  const dispatch = useAppDispatch();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfoMessage, setAuthInfoMessage] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Load user data from Supabase
  const loadUserData = async (userId: string) => {
    try {
      // Load user profile
      const profile = await userProfileService.getProfile(userId);
      
      if (profile) {
        // Load all user data
        const [fixedExpenses, expenses, incomes] = await Promise.all([
          fixedExpensesService.getFixedExpenses(userId),
          expensesService.getExpenses(userId),
          incomesService.getIncomes(userId),
        ]);

        // Dispatch to load data into context
        dispatch({
          type: 'LOAD_USER_DATA',
          payload: {
            userProfile: {
              name: profile.name,
              age: profile.age,
              familyMembers: profile.family_members,
            },
            monthlyIncome: profile.monthly_income,
            fixedExpenses: fixedExpenses,
            expenses: expenses,
            incomes: incomes,
            isOnboardingComplete: profile.onboarding_complete,
          },
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setIsCheckingSession(false);
          return;
        }

        if (session?.user) {
          const user = session.user;
          const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
          
          // Load user data from Supabase
          await loadUserData(user.id);
          
          dispatch({
            type: 'SIGN_IN',
            payload: { name, email: user.email || '' },
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        
        // Load user data from Supabase
        await loadUserData(user.id);
        
        dispatch({
          type: 'SIGN_IN',
          payload: { name, email: user.email || '' },
        });
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'SIGN_OUT' });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  // Show authentication pages if not authenticated
  if (!isAuthenticated) {
    const handleSignIn = async (email: string, password: string) => {
      setIsLoading(true);
      setAuthError(null);
      setAuthInfoMessage(null);
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setAuthError(error.message);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0] || 'User';
          dispatch({
            type: 'SIGN_IN',
            payload: { name, email },
          });
        }
      } catch (error: any) {
        setAuthError(error.message || 'An error occurred during sign in');
      } finally {
        setIsLoading(false);
      }
    };

    const handleSignUp = async (name: string, email: string, password: string, confirmPassword: string) => {
      setIsLoading(true);
      setAuthError(null);
      setAuthInfoMessage(null);

      if (password !== confirmPassword) {
        setAuthError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              name: name,
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          setAuthError(error.message);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          // Check if email confirmation is required
          if (data.session) {
            // User is automatically signed in (email confirmation disabled)
            const userName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || name;
            dispatch({
              type: 'SIGN_UP',
              payload: { name: userName, email },
            });
          } else {
            // Email confirmation required - show as info message (green)
            setAuthInfoMessage('Please check your email to confirm your account before signing in.');
            setIsLoading(false);
          }
        }
      } catch (error: any) {
        setAuthError(error.message || 'An error occurred during sign up');
        setIsLoading(false);
      }
    };

    const handleGoogleSignIn = async () => {
      setIsLoading(true);
      setAuthError(null);
      setAuthInfoMessage(null);

      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });

        if (error) {
          setAuthError(error.message);
          setIsLoading(false);
        }
        // Note: OAuth will redirect, so we don't set loading to false here
      } catch (error: any) {
        setAuthError(error.message || 'An error occurred during Google sign in');
        setIsLoading(false);
      }
    };

    const handleGoogleSignUp = async () => {
      // Google sign up is the same as sign in for OAuth
      await handleGoogleSignIn();
    };

    const handleForgotPassword = async (email: string) => {
      setIsLoading(true);
      setAuthError(null);
      setAuthInfoMessage(null);

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          setAuthError(error.message);
          setIsLoading(false);
          return;
        }

        // Success - show info message
        setAuthInfoMessage('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
        setIsLoading(false);
      } catch (error: any) {
        setAuthError(error.message || 'An error occurred while sending the password reset email');
        setIsLoading(false);
      }
    };

    // Show loading state while checking session
    if (isCheckingSession) {
      return (
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-on-background">Loading...</p>
          </div>
        </div>
      );
    }

    if (authMode === 'signin') {
      return (
        <SignIn
          onSignIn={handleSignIn}
          onGoogleSignIn={handleGoogleSignIn}
          onSwitchToSignUp={() => {
            setAuthMode('signup');
            setAuthError(null);
            setAuthInfoMessage(null);
          }}
          onForgotPassword={handleForgotPassword}
          isLoading={isLoading}
          error={authError}
          infoMessage={authInfoMessage}
        />
      );
    } else {
      return (
        <SignUp
          onSignUp={handleSignUp}
          onGoogleSignUp={handleGoogleSignUp}
          onSwitchToSignIn={() => {
            setAuthMode('signin');
            setAuthError(null);
            setAuthInfoMessage(null);
          }}
          isLoading={isLoading}
          error={authError}
          infoMessage={authInfoMessage}
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
