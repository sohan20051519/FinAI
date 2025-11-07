import React, { useState } from 'react';
import { View } from '../../App';
import { HomeIcon, PlusCircleIcon, ShoppingCartIcon, ChatBubbleLeftRightIcon, ChartBarIcon, TrophyIcon, UsersIcon, SparklesIcon } from '../icons/Icons';
import { useAppDispatch } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import ConfirmDialog from '../ui/ConfirmDialog';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

// Logout Icon
const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
  </svg>
);

const NavItem: React.FC<{
  // Fix: Use React.ReactElement instead of JSX.Element to resolve namespace issue.
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-colors duration-200 ${
      isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'
    }`}
  >
    {React.cloneElement(icon, { className: 'h-6 w-6' })}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const dispatch = useAppDispatch();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { id: 'expenses', label: 'Log Transaction', icon: <PlusCircleIcon /> },
    { id: 'planner', label: 'Planner', icon: <ShoppingCartIcon /> },
    { id: 'assistant', label: 'Assistant', icon: <ChatBubbleLeftRightIcon /> },
    { id: 'reports', label: 'Reports', icon: <ChartBarIcon /> },
    { id: 'gamification', label: 'Achievements', icon: <TrophyIcon /> },
    { id: 'family', label: 'Family', icon: <UsersIcon /> },
    { id: 'healthy-launches', label: 'Healthy Products', icon: <SparklesIcon /> },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      // Always dispatch SIGN_OUT to clear local state
      dispatch({ type: 'SIGN_OUT' });
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Error signing out:', error);
      // Still dispatch SIGN_OUT even if Supabase signOut fails
      dispatch({ type: 'SIGN_OUT' });
      setShowLogoutConfirm(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface-variant/30 p-4 space-y-2">
      {/* Logo/Brand */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-container">
          <span className="text-sm font-bold text-primary">FinAI</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-on-background">FinAI</h2>
          <p className="text-xs text-on-surface-variant">AI Budget Assistant</p>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={currentView === item.id}
            onClick={() => setCurrentView(item.id as View)}
          />
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogoutClick}
        disabled={isLoggingOut}
        className="flex items-center gap-3 w-full py-3 px-4 rounded-xl text-on-surface-variant hover:bg-surface-variant hover:text-error transition-colors duration-200 mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <LogoutIcon className="h-6 w-6" />
        <span className="text-sm font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
      </button>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out? You'll need to sign in again to access your data."
        confirmText="Logout"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </aside>
  );
};

export default Sidebar;