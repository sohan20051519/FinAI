import React from 'react';
import { View } from '../../App';
import { HomeIcon, PlusCircleIcon, ShoppingCartIcon, ChatBubbleLeftRightIcon, ChartBarIcon, TrophyIcon, UsersIcon, SparklesIcon } from '../icons/Icons';

interface BottomNavProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
  // Fix: Use React.ReactElement instead of JSX.Element to resolve namespace issue.
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center flex-1 min-w-0 px-1 sm:px-2 pt-2 pb-1 transition-colors duration-200 touch-manipulation"
  >
    <div className={`rounded-full px-3 sm:px-4 md:px-6 py-1 transition-colors duration-200 mb-0.5 sm:mb-1 ${isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'}`}>
      {React.cloneElement(icon, { className: 'h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6' })}
    </div>
    <span className={`text-[10px] sm:text-xs font-medium truncate w-full text-center ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>{label}</span>
  </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: <HomeIcon /> },
    { id: 'expenses', label: 'Log', icon: <PlusCircleIcon /> },
    { id: 'planner', label: 'Plan', icon: <ShoppingCartIcon /> },
    { id: 'assistant', label: 'AI', icon: <ChatBubbleLeftRightIcon /> },
    { id: 'reports', label: 'Stats', icon: <ChartBarIcon /> },
    { id: 'gamification', label: 'Achieve', icon: <TrophyIcon /> },
    { id: 'family', label: 'Family', icon: <UsersIcon /> },
    { id: 'healthy-launches', label: 'Products', icon: <SparklesIcon /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 sm:h-20 bg-surface-variant/30 border-t border-outline/20 backdrop-blur-sm z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-full overflow-x-auto scrollbar-hide">
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
    </nav>
  );
};

export default BottomNav;