import React, { useState } from 'react';
import { GroceryItem } from '../../types';
import GroceryPlannerTab from './GroceryPlannerTab';
import RecipePlannerTab from './RecipePlannerTab';
import GroceryCartTab from './GroceryCartTab';
import { ShoppingCartIcon, BookOpenIcon, MagnifyingGlassIcon } from '../icons/Icons';

const Header: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-on-surface">{title}</h1>
        <p className="text-sm sm:text-base text-on-surface-variant">{subtitle}</p>
    </header>
);

const Planner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'grocery' | 'recipe' | 'cart'>('grocery');
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);

  const handleGroceryListGenerated = (list: GroceryItem[]) => {
    setGroceryList(list);
    // Optionally, switch to the cart tab automatically
    // setActiveTab('cart');
  };

  const handleGroceryListChange = (list: GroceryItem[]) => {
    setGroceryList(list);
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4">
      <Header title="AI Planner" subtitle="Create meal plans, discover recipes, and shop for groceries." />
      
      <div className="flex border-b border-outline/30 mb-4 sm:mb-6 overflow-x-auto">
        <TabButton
          icon={<ShoppingCartIcon className="h-5 w-5 mr-2" />}
          label="Grocery Planner"
          isActive={activeTab === 'grocery'}
          onClick={() => setActiveTab('grocery')}
        />
        <TabButton
          icon={<BookOpenIcon className="h-5 w-5 mr-2" />}
          label="Recipe Planner"
          isActive={activeTab === 'recipe'}
          onClick={() => setActiveTab('recipe')}
        />
        <TabButton
          icon={<MagnifyingGlassIcon className="h-5 w-5 mr-2" />}
          label="AI Grocery Cart"
          isActive={activeTab === 'cart'}
          onClick={() => setActiveTab('cart')}
        />
      </div>

      <div>
        {activeTab === 'grocery' && <GroceryPlannerTab onGroceryListGenerated={handleGroceryListGenerated} />}
        {activeTab === 'recipe' && <RecipePlannerTab />}
        {/* FIX: Corrected typo from `active-tab` to `activeTab` */}
        {activeTab === 'cart' && <GroceryCartTab groceryList={groceryList} onGroceryListChange={handleGroceryListChange} />}
      </div>
    </div>
  );
};

interface TabButtonProps {
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center flex-1 min-w-[120px] sm:min-w-0 px-2 sm:px-3 py-3 text-xs sm:text-sm lg:text-base font-medium transition-colors duration-200 ${
            isActive
                ? 'border-b-2 border-primary text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
        }`}
    >
        {React.cloneElement(icon, { className: 'h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2' })}
        <span className="whitespace-nowrap">{label}</span>
    </button>
);


export default Planner;