import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { generateGroceryPlan, generateImagePlan, generateVideoPlan } from '../../services/geminiService';
// FIX: Import Meal type to be used explicitly.
import { MealPlan, GroceryItem, Meal } from '../../types';
import { useAppState } from '../../context/AppContext';

interface GroceryPlannerTabProps {
    onGroceryListGenerated: (list: GroceryItem[]) => void;
}

const PlannerForm: React.FC<{
  onGenerate: (type: 'text' | 'image' | 'video') => void;
  loading: 'text' | 'image' | 'video' | null;
  isApiKeySelectedForVideo: boolean;
  onSelectApiKey: () => void;
  formState: { budget: string; people: string; preferences: string; };
  setFormState: React.Dispatch<React.SetStateAction<{ budget: string; people: string; preferences: string; }>>;
}> = ({ onGenerate, loading, isApiKeySelectedForVideo, onSelectApiKey, formState, setFormState }) => {
  const { budget, people, preferences } = formState;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prev => ({ ...prev, [id]: value }));
  };
  
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

const PlanDisplay: React.FC<{ plan: MealPlan }> = ({ plan }) => {
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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
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
    )
}

const GroceryPlannerTab: React.FC<GroceryPlannerTabProps> = ({ onGroceryListGenerated }) => {
  const { userProfile } = useAppState();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState<'text' | 'image' | 'video' | null>(null);
  const [error, setError] = useState('');
  const [videoPollMessage, setVideoPollMessage] = useState('Generating your video plan...');
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);

  const [formState, setFormState] = useState({
    budget: '5000',
    people: userProfile?.familyMembers?.toString() || '2',
    preferences: 'No specific preferences',
  });

  useEffect(() => {
    const checkApiKey = async () => {
        if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
            setIsApiKeySelected(true);
        }
    };
    checkApiKey();
  }, []);

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
    
    const { budget, people, preferences } = formState;

    try {
      if (type === 'text') {
        const result = await generateGroceryPlan(parseInt(budget), parseInt(people), preferences);
        setPlan(result);
        if (result.groceryList) {
            onGroceryListGenerated(result.groceryList);
        }
      } else if (type === 'image') {
        const result = await generateImagePlan(parseInt(budget), parseInt(people), preferences);
        setImageUrl(result);
      } else if (type === 'video') {
        const result = await generateVideoPlan(parseInt(budget), parseInt(people), preferences, setVideoPollMessage);
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
      
      {plan && !loading && <PlanDisplay plan={plan} />}
      
      {imageUrl && !loading && (
          <Card className="mt-8">
              <h2 className="text-2xl font-medium text-on-surface-variant mb-4">Image Plan</h2>
              <img src={imageUrl} alt="Generated grocery plan" className="rounded-2xl w-full" />
          </Card>
      )}

      {videoUrl && !loading && (
          <Card className="mt-8">
              <h2 className="text-2xl font-medium text-on-surface-variant mb-4">Video Plan</h2>
              <video src={videoUrl} controls className="rounded-2xl w-full"></video>
          </Card>
      )}
    </div>
  );
};

export default GroceryPlannerTab;