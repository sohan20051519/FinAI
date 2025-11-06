import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { generateGroceryPlan, generateImagePlan, generateVideoPlan } from '../../services/geminiService';
// FIX: Import Meal type to be used explicitly.
import { MealPlan, GroceryItem, Meal } from '../../types';
import { useAppState } from '../../context/AppContext';
import { downloadPlanAsPDF, downloadImage, downloadVideo } from '../../utils/downloadUtils';
import { ArrowDownTrayIcon, TrashIcon } from '../icons/Icons';
import { supabase } from '../../lib/supabase';
import { mealPlansService } from '../../services/supabaseService';

interface GroceryPlannerTabProps {
    onGroceryListGenerated: (list: GroceryItem[]) => void;
}

const PlannerForm: React.FC<{
  onGenerate: (type: 'text' | 'image' | 'video') => void;
  loading: 'text' | 'image' | 'video' | null;
  isApiKeySelectedForVideo: boolean;
  onSelectApiKey: () => void;
  formState: { budget: string; people: string; preferences: string; region: string; };
  setFormState: React.Dispatch<React.SetStateAction<{ budget: string; people: string; preferences: string; region: string; }>>;
}> = ({ onGenerate, loading, isApiKeySelectedForVideo, onSelectApiKey, formState, setFormState }) => {
  const { budget, people, preferences, region } = formState;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  const indianRegions = [
    { value: 'north', label: 'North India (Punjab, Delhi, Haryana, UP, etc.)' },
    { value: 'south', label: 'South India (Tamil Nadu, Karnataka, Kerala, Andhra Pradesh, etc.)' },
    { value: 'east', label: 'East India (West Bengal, Odisha, Bihar, Jharkhand, etc.)' },
    { value: 'west', label: 'West India (Maharashtra, Gujarat, Rajasthan, etc.)' },
    { value: 'northeast', label: 'Northeast India (Assam, Manipur, Meghalaya, etc.)' },
    { value: 'central', label: 'Central India (Madhya Pradesh, Chhattisgarh, etc.)' },
    { value: 'other', label: 'Other/General Indian' },
  ];
  
  return (
    <Card>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-on-surface-variant mb-1">Weekly Budget (₹)</label>
            <input id="budget" type="number" value={budget} onChange={handleInputChange} className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface placeholder:text-on-surface-variant" required />
          </div>
          <div>
            <label htmlFor="people" className="block text-sm font-medium text-on-surface-variant mb-1">Number of People</label>
            <input id="people" type="number" value={people} onChange={handleInputChange} className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface placeholder:text-on-surface-variant" required />
          </div>
        </div>
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-on-surface-variant mb-1">Region/State</label>
          <select 
            id="region" 
            value={region} 
            onChange={handleInputChange} 
            className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface"
            required
          >
            <option value="">Select your region...</option>
            {indianRegions.map(reg => (
              <option key={reg.value} value={reg.value}>{reg.label}</option>
            ))}
          </select>
          <p className="text-xs text-on-surface-variant mt-1">This helps customize ingredients and cuisine based on your region</p>
        </div>
        <div>
          <label htmlFor="preferences" className="block text-sm font-medium text-on-surface-variant mb-1">Dietary Preferences (e.g., vegetarian, low-carb)</label>
          <textarea id="preferences" value={preferences} onChange={handleInputChange} className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface placeholder:text-on-surface-variant" rows={3}></textarea>
        </div>
        <div className="flex flex-wrap gap-4 items-center pt-2">
            <Button type="button" onClick={() => onGenerate('text')} disabled={loading !== null}>
                {loading === 'text' ? <Spinner/> : 'Generate Text Plan'}
            </Button>
            <Button type="button" onClick={() => onGenerate('image')} disabled={loading !== null}>
                {loading === 'image' ? <Spinner/> : 'Generate Image Plan'}
            </Button>
            {isApiKeySelectedForVideo ? (
                <Button type="button" onClick={() => onGenerate('video')} disabled={loading !== null}>
                    {loading === 'video' ? <Spinner/> : 'Generate Video Plan'}
                </Button>
            ) : (
                  <div className="flex flex-col">
                    <Button type="button" onClick={onSelectApiKey} disabled={loading !== null}>Select API Key for Video</Button>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant mt-1 hover:underline">Billing information</a>
                </div>
            )}
        </div>
      </form>
    </Card>
  );
};

interface SavedPlan {
  id: string;
  name: string;
  mealPlan: MealPlan;
  budget?: number;
  people?: number;
  region?: string;
  preferences?: string;
  createdAt: string;
  updatedAt: string;
}

const PlanDisplay: React.FC<{ 
    plan: MealPlan; 
    budget: number; 
    people: number; 
    region: string; 
    preferences: string;
    onSave?: (name: string) => void;
    onDelete?: () => void;
    savedPlanId?: string;
    isSaving?: boolean;
}> = ({ plan, budget, people, region, preferences, onSave, onDelete, savedPlanId, isSaving }) => {
    // FIX: Explicitly type the initial value of the reduce function to prevent TypeScript
    // from inferring `groupedList` as `unknown`, which causes a downstream error on `items.map`.
    const groupedList = (plan.groceryList || []).reduce((acc: Record<string, GroceryItem[]>, item) => {
        const category = item.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, GroceryItem[]>);

    const [saveName, setSaveName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    const handleDownloadPDF = () => {
        downloadPlanAsPDF(plan, budget, people, region, preferences);
    };

    const handleSaveClick = () => {
        if (savedPlanId) {
            // Already saved, just update
            if (onSave) onSave(saveName || `Meal Plan - ${new Date().toLocaleDateString()}`);
        } else {
            // Show save dialog
            setShowSaveDialog(true);
        }
    };

    const handleSaveConfirm = () => {
        if (onSave) {
            onSave(saveName || `Meal Plan - ${new Date().toLocaleDateString()}`);
            setShowSaveDialog(false);
            setSaveName('');
        }
    };

    return (
        <div className="mt-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h2 className="text-2xl font-medium text-on-surface-variant">Meal Plan & Grocery List</h2>
                <div className="flex gap-2 flex-wrap">
                    {onSave && (
                        <>
                            {showSaveDialog ? (
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={saveName}
                                        onChange={(e) => setSaveName(e.target.value)}
                                        placeholder="Plan name..."
                                        className="bg-surface-variant/50 p-2 rounded-lg border border-outline/30 text-on-surface"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSaveConfirm()}
                                        autoFocus
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleSaveConfirm}
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
                                <Button
                                    type="button"
                                    onClick={handleSaveClick}
                                    disabled={isSaving}
                                    className="flex items-center gap-2"
                                >
                                    {isSaving ? 'Saving...' : savedPlanId ? 'Update Saved' : 'Save Plan'}
                                </Button>
                            )}
                            {savedPlanId && onDelete && (
                                <Button
                                    type="button"
                                    onClick={onDelete}
                                    className="flex items-center gap-2 !bg-error-container !text-on-error-container"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                    Delete
                                </Button>
                            )}
                        </>
                    )}
                    <Button
                        type="button"
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        Download PDF
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-2xl font-medium text-on-surface-variant mb-4">Meal Plan</h2>
                    <div className="space-y-4">
                        {/* FIX: Explicitly type `day` as `Meal` to resolve potential type inference issues from API responses. */}
                        {Array.isArray(plan.mealPlan) && plan.mealPlan.map((day: Meal) => (
                            <div key={day.day}>
                                <h3 className="font-bold text-lg text-on-surface">{day.day}</h3>
                                <ul className="text-sm text-on-surface-variant list-disc pl-5">
                                    <li><strong>Breakfast:</strong> {day.breakfast}</li>
                                    <li><strong>Lunch:</strong> {day.lunch}</li>
                                    <li><strong>Dinner:</strong> {day.dinner}</li>
                                </ul>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card>
                    <h2 className="text-2xl font-medium text-on-surface-variant mb-4">Grocery List</h2>
                    <div className="space-y-4">
                        {Object.entries(groupedList).map(([category, items]) => (
                            <div key={category}>
                                <h3 className="font-bold text-lg text-on-surface">{category}</h3>
                                <ul className="text-sm text-on-surface-variant list-disc pl-5">
                                    {items.map(item => <li key={item.item}>{item.item} ({item.quantity})</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}

const GroceryPlannerTab: React.FC<GroceryPlannerTabProps> = ({ onGroceryListGenerated }) => {
  const { userProfile } = useAppState();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [currentSavedPlanId, setCurrentSavedPlanId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [loading, setLoading] = useState<'text' | 'image' | 'video' | null>(null);
  const [error, setError] = useState('');
  const [videoPollMessage, setVideoPollMessage] = useState('Generating your video plan...');
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);

  const [formState, setFormState] = useState({
    budget: '5000',
    people: userProfile?.familyMembers?.toString() || '2',
    preferences: 'No specific preferences',
    region: '',
  });

  useEffect(() => {
    const checkApiKey = async () => {
        if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
            setIsApiKeySelected(true);
        }
    };
    checkApiKey();
    loadSavedPlans();
  }, []);

  const loadSavedPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const plans = await mealPlansService.getMealPlans(user.id);
      setSavedPlans(plans);
    } catch (error) {
      console.error('Error loading saved plans:', error);
    }
  };

  const handleSavePlan = async (name: string) => {
    if (!plan) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const savedPlan = await mealPlansService.saveMealPlan(
        user.id,
        plan,
        name,
        parseInt(formState.budget),
        parseInt(formState.people),
        formState.region,
        formState.preferences,
        currentSavedPlanId || undefined
      );
      
      setCurrentSavedPlanId(savedPlan.id);
      await loadSavedPlans();
    } catch (err: any) {
      console.error('Error saving plan:', err);
      setSaveError(err.message || 'Failed to save plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadPlan = async (planId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const savedPlan = await mealPlansService.getMealPlan(user.id, planId);
      if (savedPlan) {
        setPlan(savedPlan.mealPlan);
        setCurrentSavedPlanId(savedPlan.id);
        if (savedPlan.budget) setFormState(prev => ({ ...prev, budget: savedPlan.budget!.toString() }));
        if (savedPlan.people) setFormState(prev => ({ ...prev, people: savedPlan.people!.toString() }));
        if (savedPlan.region) setFormState(prev => ({ ...prev, region: savedPlan.region! }));
        if (savedPlan.preferences) setFormState(prev => ({ ...prev, preferences: savedPlan.preferences! }));
        if (savedPlan.mealPlan.groceryList) {
          onGroceryListGenerated(savedPlan.mealPlan.groceryList);
        }
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      setError('Failed to load saved plan');
    }
  };

  const handleDeletePlan = async () => {
    if (!currentSavedPlanId) return;
    
    if (!window.confirm('Are you sure you want to delete this saved plan?')) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await mealPlansService.deleteMealPlan(user.id, currentSavedPlanId);
      setCurrentSavedPlanId(null);
      setPlan(null);
      await loadSavedPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError('Failed to delete plan');
    }
  };

  const handleSelectApiKey = async () => {
    if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        setIsApiKeySelected(true);
    }
  };

  const handleGenerate = async (type: 'text' | 'image' | 'video') => {
    setLoading(type);
    setError('');
    setPlan(null);
    setImageUrl(null);
    setVideoUrl(null);

    if (type === 'video' && !isApiKeySelected) {
        setError('Please select an API key to generate a video.');
        setLoading(null);
        return;
    }
    
    const { budget, people, preferences, region } = formState;

    try {
      if (type === 'text') {
        const result = await generateGroceryPlan(parseInt(budget), parseInt(people), preferences, region);
        setPlan(result);
        setCurrentSavedPlanId(null); // New plan, not saved yet
        if (result.groceryList) {
            onGroceryListGenerated(result.groceryList);
        }
        // Autosave after generating
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const autoSaveName = `Meal Plan - ${new Date().toLocaleDateString()}`;
            const savedPlan = await mealPlansService.saveMealPlan(
              user.id,
              result,
              autoSaveName,
              parseInt(budget),
              parseInt(people),
              region,
              preferences
            );
            setCurrentSavedPlanId(savedPlan.id);
            await loadSavedPlans();
          }
        } catch (err) {
          console.warn('Autosave failed:', err);
          // Don't show error for autosave failures
        }
      } else if (type === 'image') {
        const result = await generateImagePlan(parseInt(budget), parseInt(people), preferences, region);
        setImageUrl(result);
      } else if (type === 'video') {
        const result = await generateVideoPlan(parseInt(budget), parseInt(people), preferences, region, setVideoPollMessage);
        setVideoUrl(result);
        setVideoPollMessage('');
      }
    } catch (err: any) {
        const errorMessage = err.message || 'An unknown error occurred.';
        console.error(`Error generating ${type} plan:`, err);

        if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.toLowerCase().includes('quota')) {
            setError(`You've exceeded your API quota. For free-tier issues or to set up billing, please check your Google AI project settings.`);
        } else if (type === 'video' && errorMessage.includes('Requested entity was not found')) {
            setError('API Key is invalid. Please select a valid API key.');
            setIsApiKeySelected(false);
        } else {
            setError(`An error occurred while generating the ${type} plan. Please try again.`);
        }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      {/* Saved Plans Dropdown */}
      {savedPlans.length > 0 && (
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="text-sm font-medium text-on-surface-variant">Load Saved Plan:</label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleLoadPlan(e.target.value);
              }}
              className="flex-1 bg-surface-variant/50 p-2 rounded-lg border border-outline/30 text-on-surface"
            >
              <option value="">Select a saved plan...</option>
              {savedPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({new Date(p.createdAt).toLocaleDateString()})
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

      <PlannerForm 
        onGenerate={handleGenerate} 
        loading={loading}
        isApiKeySelectedForVideo={isApiKeySelected}
        onSelectApiKey={handleSelectApiKey}
        formState={formState}
        setFormState={setFormState}
      />

      {loading && (
        <Card className="mt-8 text-center p-8">
          <Spinner />
          <p className="mt-4 text-on-surface-variant font-medium">
            {loading === 'text' && 'Generating your text plan...'}
            {loading === 'image' && 'Generating your image plan...'}
            {loading === 'video' && videoPollMessage}
          </p>
        </Card>
      )}
      {error && <p className="mt-8 text-center text-error font-medium bg-error-container p-4 rounded-xl">{error}</p>}
      
      {plan && !loading && (
        <PlanDisplay 
          plan={plan} 
          budget={parseInt(formState.budget)} 
          people={parseInt(formState.people)} 
          region={formState.region} 
          preferences={formState.preferences}
          onSave={handleSavePlan}
          onDelete={handleDeletePlan}
          savedPlanId={currentSavedPlanId || undefined}
          isSaving={isSaving}
        />
      )}
      
      {imageUrl && !loading && (
          <Card className="mt-8">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-medium text-on-surface-variant">Image Plan</h2>
                  <Button
                      type="button"
                      onClick={() => downloadImage(imageUrl, 'meal-plan-image.png')}
                      className="flex items-center gap-2"
                  >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Download Image
                  </Button>
              </div>
              <img src={imageUrl} alt="Generated grocery plan" className="rounded-2xl w-full" />
          </Card>
      )}

      {videoUrl && !loading && (
          <Card className="mt-8">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-medium text-on-surface-variant">Video Plan</h2>
                  <Button
                      type="button"
                      onClick={() => downloadVideo(videoUrl, 'meal-plan-video.mp4')}
                      className="flex items-center gap-2"
                  >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Download Video
                  </Button>
              </div>
              <video src={videoUrl} controls className="rounded-2xl w-full"></video>
          </Card>
      )}
    </div>
  );
};

export default GroceryPlannerTab;