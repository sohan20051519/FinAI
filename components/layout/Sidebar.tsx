import React from 'react';
import { View } from '../../App';
import { HomeIcon, PlusCircleIcon, ShoppingCartIcon, ChatBubbleLeftRightIcon, ChartBarIcon } from '../icons/Icons';
import { useAppDispatch } from '../../context/AppContext';

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
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { id: 'expenses', label: 'Log Transaction', icon: <PlusCircleIcon /> },
    { id: 'planner', label: 'Planner', icon: <ShoppingCartIcon /> },
    { id: 'assistant', label: 'Assistant', icon: <ChatBubbleLeftRightIcon /> },
    { id: 'reports', label: 'Reports', icon: <ChartBarIcon /> },
  ];

  const handleLogout = () => {
    dispatch({ type: 'SIGN_OUT' });
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
        onClick={handleLogout}
        className="flex items-center gap-3 w-full py-3 px-4 rounded-xl text-on-surface-variant hover:bg-surface-variant hover:text-error transition-colors duration-200 mt-auto"
      >
        <LogoutIcon className="h-6 w-6" />
        <span className="text-sm font-medium">Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;