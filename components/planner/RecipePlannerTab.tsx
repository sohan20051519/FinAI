import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { generateRecipeText, generateRecipeImage, generateRecipeVideo } from '../../services/geminiService';
import { Recipe } from '../../types';

const RecipePlannerTab: React.FC = () => {
  const [formState, setFormState] = useState({
    query: 'Quick paneer butter masala',
    ingredients: '',
    preferences: 'Vegetarian',
  });
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<'text' | 'image' | 'video' | null>(null);
  const [error, setError] = useState('');
  const [videoPollMessage, setVideoPollMessage] = useState('Generating your recipe video...');
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if ((window as any).aistudio && (await (window as any).aistudio.hasSelectedApiKey())) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  const handleGenerate = async (type: 'text' | 'image' | 'video') => {
    setLoading(type);
    setError('');

    // Clear previous results based on generation type
    if (type === 'text') {
        setRecipe(null);
        setImageUrl(null);
        setVideoUrl(null);
    } else if (type === 'image') {
        setImageUrl(null);
    } else if (type === 'video') {
        setVideoUrl(null);
    }

    if (type === 'video' && !isApiKeySelected) {
      setError('Please select an API key to generate a video.');
      setLoading(null);
      return;
    }

    try {
      if (type === 'text') {
        const result = await generateRecipeText(formState.query, formState.ingredients, formState.preferences);
        setRecipe(result);
      } else if (type === 'image') {
        if (!recipe) {
          setError('Please generate a recipe first to create an image.');
        } else {
          const result = await generateRecipeImage(recipe.recipeName, recipe.description);
          setImageUrl(result);
        }
      } else if (type === 'video') {
        if (!recipe) {
          setError('Please generate a recipe first to create a video.');
        } else {
          const result = await generateRecipeVideo(recipe.recipeName, setVideoPollMessage);
          setVideoUrl(result);
          setVideoPollMessage('');
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred.';
      console.error(`Error generating recipe ${type}:`, err);
      if (type === 'video' && errorMessage.includes('Requested entity was not found')) {
        setError('API Key is invalid. Please select a valid API key.');
        setIsApiKeySelected(false);
      } else {
        setError(`An error occurred while generating the recipe ${type}. Please try again.`);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <Card>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-on-surface-variant mb-1">What would you like to cook?</label>
            <textarea id="query" value={formState.query} onChange={handleInputChange} className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30" rows={2} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ingredients" className="block text-sm font-medium text-on-surface-variant mb-1">Ingredients on hand (optional)</label>
              <input id="ingredients" type="text" value={formState.ingredients} onChange={handleInputChange} className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30" />
            </div>
            <div>
              <label htmlFor="preferences" className="block text-sm font-medium text-on-surface-variant mb-1">Dietary Preferences</label>
              <input id="preferences" type="text" value={formState.preferences} onChange={handleInputChange} className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center pt-2">
            <Button type="button" onClick={() => handleGenerate('text')} disabled={loading !== null}>
              {loading === 'text' ? <Spinner /> : 'Generate Recipe'}
            </Button>
            <Button type="button" onClick={() => handleGenerate('image')} disabled={!recipe || loading !== null}>
              {loading === 'image' ? <Spinner /> : 'Generate Image'}
            </Button>
            {isApiKeySelected ? (
              <Button type="button" onClick={() => handleGenerate('video')} disabled={!recipe || loading !== null}>
                {loading === 'video' ? <Spinner /> : 'Generate Video'}
              </Button>
            ) : (
              <div className="flex flex-col">
                <Button type="button" onClick={handleSelectApiKey} disabled={!recipe || loading !== null}>Select API Key for Video</Button>
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant mt-1 hover:underline">Billing information</a>
              </div>
            )}
          </div>
        </form>
      </Card>

      {loading && (
        <Card className="mt-8 text-center p-8">
          <Spinner />
          <p className="mt-4 text-on-surface-variant font-medium">
            {loading === 'text' && 'Generating your recipe...'}
            {loading === 'image' && 'Generating dish image...'}
            {loading === 'video' && videoPollMessage}
          </p>
        </Card>
      )}
      {error && <p className="mt-8 text-center text-error font-medium bg-error-container p-4 rounded-xl">{error}</p>}

      {recipe && (
        <Card className="mt-8">
          <h2 className="text-3xl font-bold text-primary mb-2">{recipe.recipeName}</h2>
          <p className="text-on-surface-variant mb-4">{recipe.description}</p>
          <div className="flex flex-wrap gap-4 text-sm mb-6">
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full"><strong>Prep:</strong> {recipe.prepTime}</span>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full"><strong>Cook:</strong> {recipe.cookTime}</span>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full"><strong>Servings:</strong> {recipe.servings}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="text-xl font-medium text-on-surface mb-2">Ingredients</h3>
              <ul className="list-disc pl-5 space-y-1 text-on-surface-variant">
                {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-xl font-medium text-on-surface mb-2">Instructions</h3>
              <ol className="list-decimal pl-5 space-y-2 text-on-surface-variant">
                {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </div>
          </div>
        </Card>
      )}
      
      {imageUrl && <Card className="mt-8"><h3 className="text-xl font-medium text-on-surface mb-4">Generated Image</h3><img src={imageUrl} alt={recipe?.recipeName} className="rounded-2xl w-full" /></Card>}
      {videoUrl && <Card className="mt-8"><h3 className="text-xl font-medium text-on-surface mb-4">Generated Video</h3><video src={videoUrl} controls className="rounded-2xl w-full"></video></Card>}
    </div>
  );
};

export default RecipePlannerTab;