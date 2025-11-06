
import React, { useState, useEffect } from 'react';
import { GroceryItem, GroceryLink } from '../../types';
import { findGroceryOnline } from '../../services/geminiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { supabase } from '../../lib/supabase';
import { groceryListsService } from '../../services/supabaseService';
import { ArrowDownTrayIcon, TrashIcon } from '../icons/Icons';

interface GroceryCartTabProps {
  groceryList: GroceryItem[];
  onGroceryListChange?: (list: GroceryItem[]) => void;
}

interface SavedGroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  createdAt: string;
  updatedAt: string;
}

interface SearchStateType {
  [itemName: string]: {
    loading: boolean;
    links: GroceryLink[] | null;
    error: string | null;
  };
}

const GroceryCartTab: React.FC<GroceryCartTabProps> = ({ groceryList, onGroceryListChange }) => {
  const [searchState, setSearchState] = useState<SearchStateType>({});
  const [savedLists, setSavedLists] = useState<SavedGroceryList[]>([]);
  const [currentSavedListId, setCurrentSavedListId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentList, setCurrentList] = useState<GroceryItem[]>(groceryList);

  useEffect(() => {
    setCurrentList(groceryList);
    loadSavedLists();
  }, [groceryList]);

  const loadSavedLists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const lists = await groceryListsService.getGroceryLists(user.id);
      setSavedLists(lists);
    } catch (error) {
      console.error('Error loading saved grocery lists:', error);
    }
  };

  const handleSaveList = async (name: string) => {
    if (currentList.length === 0) {
      setSaveError('Cannot save an empty grocery list');
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const savedList = await groceryListsService.saveGroceryList(
        user.id,
        currentList,
        name,
        currentSavedListId || undefined
      );
      
      setCurrentSavedListId(savedList.id);
      await loadSavedLists();
      setShowSaveDialog(false);
      setSaveName('');
    } catch (err: any) {
      console.error('Error saving grocery list:', err);
      setSaveError(err.message || 'Failed to save grocery list');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadList = async (listId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const savedList = await groceryListsService.getGroceryList(user.id, listId);
      if (savedList) {
        setCurrentList(savedList.items);
        setCurrentSavedListId(savedList.id);
        if (onGroceryListChange) {
          onGroceryListChange(savedList.items);
        }
      }
    } catch (error) {
      console.error('Error loading grocery list:', error);
      setSaveError('Failed to load saved grocery list');
    }
  };

  const handleDeleteList = async () => {
    if (!currentSavedListId) return;
    
    if (!window.confirm('Are you sure you want to delete this saved grocery list?')) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await groceryListsService.deleteGroceryList(user.id, currentSavedListId);
      setCurrentSavedListId(null);
      setCurrentList([]);
      if (onGroceryListChange) {
        onGroceryListChange([]);
      }
      await loadSavedLists();
    } catch (error) {
      console.error('Error deleting grocery list:', error);
      setSaveError('Failed to delete grocery list');
    }
  };

  const handleDownloadList = () => {
    if (currentList.length === 0) return;
    
    const listText = `GROCERY LIST\n${'='.repeat(50)}\n\n${currentList.map((item, i) => `${i + 1}. ${item.item} - ${item.quantity}${item.category ? ` (${item.category})` : ''}`).join('\n')}\n\nGenerated: ${new Date().toLocaleDateString()}`;
    
    const blob = new Blob([listText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Grocery_List_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  // Autosave when list changes (only if list is not empty and not already saved)
  useEffect(() => {
    if (currentList.length > 0 && !currentSavedListId) {
      const autoSave = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const autoSaveName = `Grocery List - ${new Date().toLocaleDateString()}`;
            const savedList = await groceryListsService.saveGroceryList(
              user.id,
              currentList,
              autoSaveName
            );
            setCurrentSavedListId(savedList.id);
            await loadSavedLists();
          }
        } catch (err) {
          console.warn('Autosave failed:', err);
          // Don't show error for autosave failures
        }
      };
      // Delay autosave slightly to avoid too many saves
      const timeoutId = setTimeout(autoSave, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [currentList.length, currentSavedListId]);

  return (
    <div>
      {/* Saved Lists Dropdown */}
      {savedLists.length > 0 && (
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="text-sm font-medium text-on-surface-variant">Load Saved List:</label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleLoadList(e.target.value);
              }}
              className="flex-1 bg-surface-variant/50 p-2 rounded-lg border border-outline/30 text-on-surface"
            >
              <option value="">Select a saved grocery list...</option>
              {savedLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} ({new Date(list.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {saveError && (
        <div className="mb-4 bg-error-container border border-error rounded-lg p-2 sm:p-2.5">
          <p className="text-[10px] sm:text-xs text-error">{saveError}</p>
        </div>
      )}

      {currentList.length === 0 ? (
        <Card className="text-center">
          <p className="text-on-surface-variant">
            Your grocery list is empty. Go to the <strong className="text-on-surface">Grocery Planner</strong> tab to generate a meal plan and a shopping list first.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h2 className="text-2xl font-medium text-on-surface-variant">Your Grocery List</h2>
            <div className="flex gap-2 flex-wrap">
              {showSaveDialog ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="List name..."
                    className="bg-surface-variant/50 p-2 rounded-lg border border-outline/30 text-on-surface"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveList(saveName || `Grocery List - ${new Date().toLocaleDateString()}`)}
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={() => handleSaveList(saveName || `Grocery List - ${new Date().toLocaleDateString()}`)}
                    disabled={isSaving}
                    className="!px-4"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowSaveDialog(false);
                      setSaveName('');
                    }}
                    className="!px-4 !bg-secondary-container !text-on-secondary-container"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={() => {
                      if (currentSavedListId) {
                        handleSaveList(saveName || `Grocery List - ${new Date().toLocaleDateString()}`);
                      } else {
                        setShowSaveDialog(true);
                      }
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? 'Saving...' : currentSavedListId ? 'Update Saved' : 'Save List'}
                  </Button>
                  {currentSavedListId && (
                    <Button
                      type="button"
                      onClick={handleDeleteList}
                      className="flex items-center gap-2 !bg-error-container !text-on-error-container"
                    >
                      <TrashIcon className="h-5 w-5" />
                      Delete
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleDownloadList}
                    className="flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Download
                  </Button>
                  <Button 
                    onClick={() => {
                      // TODO: Implement family sharing feature
                      alert('Family sharing feature coming soon! Share your grocery list with family members (parents can edit, kids can view).');
                    }}
                    className="text-sm"
                  >
                    👨‍👩‍👧‍👦 Share with Family
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mb-4 bg-primary-container/30 p-2 rounded-lg">
            💡 <strong>Family Collaboration:</strong> Share this list with family members. Parents can edit, kids can view. Coming soon!
          </p>
          <ul className="divide-y divide-outline/20">
            {currentList.map((item) => (
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
      )}
    </div>
  );
};

export default GroceryCartTab;
