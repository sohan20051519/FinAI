
import React, { useState } from 'react';
import { GroceryItem, GroceryLink } from '../../types';
import { findGroceryOnline } from '../../services/geminiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

interface GroceryCartTabProps {
  groceryList: GroceryItem[];
}

interface SearchStateType {
  [itemName: string]: {
    loading: boolean;
    links: GroceryLink[] | null;
    error: string | null;
  };
}

const GroceryCartTab: React.FC<GroceryCartTabProps> = ({ groceryList }) => {
  const [searchState, setSearchState] = useState<SearchStateType>({});

  const handleFindOnline = async (item: GroceryItem) => {
    setSearchState(prev => ({
      ...prev,
      [item.item]: { loading: true, links: null, error: null },
    }));

    try {
      const links = await findGroceryOnline(item.item);
      setSearchState(prev => ({
        ...prev,
        [item.item]: { loading: false, links: links, error: null },
      }));
    } catch (err: any) {
      setSearchState(prev => ({
        ...prev,
        [item.item]: { loading: false, links: null, error: err.message || 'Failed to search.' },
      }));
    }
  };

  if (groceryList.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-on-surface-variant">
          Your grocery list is empty. Go to the <strong className="text-on-surface">Grocery Planner</strong> tab to generate a meal plan and a shopping list first.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-2xl font-medium text-on-surface-variant mb-4">Your Grocery List</h2>
      <ul className="divide-y divide-outline/20">
        {groceryList.map((item) => (
          <li key={item.item} className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium text-on-surface">{item.item}</p>
                <p className="text-sm text-on-surface-variant">Quantity: {item.quantity}</p>
              </div>
              <Button onClick={() => handleFindOnline(item)} disabled={searchState[item.item]?.loading} className="w-full sm:w-auto">
                {searchState[item.item]?.loading ? <Spinner /> : 'Find Online'}
              </Button>
            </div>
            
            {searchState[item.item] && !searchState[item.item].loading && (
              <div className="mt-4 pl-4 border-l-2 border-primary-container">
                {searchState[item.item].error && <p className="text-error text-sm">{searchState[item.item].error}</p>}
                
                {searchState[item.item].links && searchState[item.item].links!.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-on-surface-variant mb-2">Shopping Links:</h4>
                    <ul className="space-y-1">
                      {searchState[item.item].links!.map((link, index) => (
                        <li key={index}>
                          <a 
                            href={link.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline text-sm"
                          >
                            {link.title || 'View Link'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {searchState[item.item].links && searchState[item.item].links!.length === 0 && (
                  <p className="text-sm text-on-surface-variant">No online options found for this item.</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default GroceryCartTab;
