import React from 'react';
import { View } from '../../App';
import { HomeIcon, PlusCircleIcon, ShoppingCartIcon, ChatBubbleLeftRightIcon, ChartBarIcon } from '../icons/Icons';

interface SidebarProps {
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
    className={`flex flex-col items-center justify-center w-full py-3 px-2 rounded-2xl space-y-1 transition-colors duration-200 ${
      isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'
    }`}
  >
    {React.cloneElement(icon, { className: 'h-6 w-6' })}
    <span className="text-xs font-medium tracking-wide">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { id: 'expenses', label: 'Log Transaction', icon: <PlusCircleIcon /> },
    { id: 'planner', label: 'Planner', icon: <ShoppingCartIcon /> },
    { id: 'assistant', label: 'Assistant', icon: <ChatBubbleLeftRightIcon /> },
    { id: 'reports', label: 'Reports', icon: <ChartBarIcon /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-24 bg-surface-variant/30 p-2 space-y-2">
       <div className="text-primary font-bold text-center py-4 text-xl">
        BB
      </div>
      {navItems.map((item) => (
        <NavItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          isActive={currentView === item.id}
          onClick={() => setCurrentView(item.id as View)}
        />
      ))}
    </aside>
  );
};

export default Sidebar;