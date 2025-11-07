
import React, { useState, useEffect } from 'react';
import { GroceryItem, GroceryLink } from '../../types';
import { findGroceryOnline } from '../../services/geminiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { supabase } from '../../lib/supabase';
import { groceryListsService } from '../../services/supabaseService';
import { ArrowDownTrayIcon, TrashIcon } from '../icons/Icons';
import { familyService } from '../../services/familyService';
import { familyChatService } from '../../services/familyChatService';

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
  const [showFamilyShareModal, setShowFamilyShareModal] = useState(false);
  const [familyGroups, setFamilyGroups] = useState<Array<{ id: string; name: string; created_by: string }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    setCurrentList(groceryList);
    loadSavedLists();
    loadFamilyGroups();
  }, [groceryList]);

  const loadFamilyGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const groups = await familyService.getUserFamilyGroups(user.id);
      setFamilyGroups(groups);
    } catch (error) {
      console.error('Error loading family groups:', error);
    }
  };

  const handleShareWithFamily = async () => {
    if (!selectedGroupId || currentList.length === 0) return;
    
    setSharing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      await familyChatService.shareGroceryList(selectedGroupId, user.id, currentList);
      setShowFamilyShareModal(false);
      setSelectedGroupId(null);
      alert('Grocery list shared successfully with family group!');
    } catch (err: any) {
      console.error('Error sharing grocery list:', err);
      alert(err.message || 'Failed to share grocery list');
    } finally {
      setSharing(false);
    }
  };

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
          <div className="flex flex-wrap justify-between items-center gap-3 sm:gap-4 mb-4">
            <h2 className="text-xl sm:text-2xl font-medium text-on-surface-variant">Your Grocery List</h2>
            <div className="flex gap-2 flex-wrap text-xs sm:text-sm">
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
                      if (familyGroups.length === 0) {
                        alert('You need to create or join a family group first. Go to the Family Groups page to get started.');
                        return;
                      }
                      setShowFamilyShareModal(true);
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
            💡 <strong>Family Collaboration:</strong> Share this list with family members. Parents can edit, kids can view.
          </p>
          <ul className="divide-y divide-outline/20">
            {currentList.map((item) => (
          <li key={item.item} className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-on-surface truncate">{item.item}</p>
                <p className="text-xs sm:text-sm text-on-surface-variant">Quantity: {item.quantity}</p>
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
                    {/* Price comparison summary if any prices are available */}
                    {(() => {
                      const links = searchState[item.item].links!;
                      const priced = links.filter(l => l.price !== undefined && l.price !== null);
                      if (priced.length === 0) return null;
                      const best = priced.reduce((min, l) => (min.price! <= l.price! ? min : l));
                      const formatINR = (p: number) => `₹${p.toLocaleString('en-IN')}`;
                      const sorted = [...priced].sort((a, b) => (a.price! - b.price!));
                      return (
                        <div className="mb-3 p-2 bg-primary-container/20 rounded">
                          <p className="text-xs sm:text-sm text-on-surface-variant">
                            Best price: <span className="font-medium text-on-surface">{best.title}</span> at <span className="font-semibold">{formatINR(best.price!)}</span>
                          </p>
                          <div className="mt-2 text-[11px] sm:text-xs text-on-surface-variant">
                            <span className="font-medium">Compare:</span>
                            {sorted.map((l, i) => (
                              <span key={i} className="ml-2 inline-block">{l.title}: <span className="text-on-surface">{formatINR(l.price!)}</span></span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    <ul className="space-y-1">
                      {searchState[item.item].links!.map((link, index) => (
                        <li key={index} className="flex items-center justify-between gap-3">
                          <a 
                            href={link.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline text-sm flex-1 truncate"
                          >
                            {link.title || 'View Link'}
                          </a>
                          <span className="text-xs sm:text-sm text-on-surface-variant">
                            {link.price !== undefined && link.price !== null 
                              ? `₹${Number(link.price).toLocaleString('en-IN')}`
                              : 'Price unavailable'}
                          </span>
                          <Button 
                            onClick={() => window.open(link.uri, '_blank')} 
                            className="!px-3 !py-1 text-xs"
                          >
                            Buy
                          </Button>
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

      {/* Family Share Modal */}
      {showFamilyShareModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFamilyShareModal(false)}></div>
          <Card className="relative w-full max-w-md !bg-white !opacity-100 shadow-2xl border-2 border-outline/20 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-outline/30">
              <h2 className="text-xl sm:text-2xl font-semibold text-on-surface">👨‍👩‍👧‍👦 Share with Family</h2>
              <button
                onClick={() => setShowFamilyShareModal(false)}
                className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors"
                aria-label="Close"
              >
                <span className="text-2xl text-on-surface-variant">×</span>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">
                Select Family Group
              </label>
              {familyGroups.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No family groups available. Create or join a group first.</p>
              ) : (
                <select
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 text-on-surface"
                >
                  <option value="">Select a family group...</option>
                  {familyGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowFamilyShareModal(false);
                  setSelectedGroupId(null);
                }}
                className="!bg-secondary-container !text-on-secondary-container"
              >
                Cancel
              </Button>
              <Button
                onClick={handleShareWithFamily}
                disabled={!selectedGroupId || sharing || currentList.length === 0}
                className="flex items-center gap-2"
              >
                {sharing ? (
                  <>
                    <Spinner />
                    Sharing...
                  </>
                ) : (
                  'Share List'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GroceryCartTab;
