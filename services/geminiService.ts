
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { ChatMessage, Expense, MealPlan, UserProfile, Income, Recipe, GroceryLink } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = ai.models;

export const generateGroceryPlan = async (
  budget: number,
  people: number,
  preferences: string
): Promise<MealPlan> => {
  const prompt = `Create a 7-day meal plan and a corresponding grocery list for ${people} people with a budget of ₹${budget} in Indian Rupees (INR). 
  Dietary preferences: ${preferences}. Consider Indian cuisine where appropriate.
  The meal plan should include breakfast, lunch, and dinner for each day.
  The grocery list should be categorized (e.g., Produce, Dairy, Meat, Pantry).
  Provide the response in a structured JSON format.`;

  try {
    const response = await model.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    mealPlan: {
                        type: Type.ARRAY,
                        description: 'A 7-day meal plan.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                day: { type: Type.STRING },
                                breakfast: { type: Type.STRING },
                                lunch: { type: Type.STRING },
                                dinner: { type: Type.STRING },
                            },
                        },
                    },
                    groceryList: {
                        type: Type.ARRAY,
                        description: 'A categorized grocery list for the meal plan.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                item: { type: Type.STRING },
                                quantity: { type: Type.STRING },
                                category: { type: Type.STRING },
                            },
                        },
                    },
                },
            },
        },
    });

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);
    return parsedJson as MealPlan;
  } catch (error) {
    console.error('Error generating grocery plan:', error);
    throw new Error('Failed to generate a meal plan. Please try again.');
  }
};

export const generateImagePlan = async (
  budget: number,
  people: number,
  preferences: string
): Promise<string> => {
    const prompt = `Create a visually appealing single image that summarizes a 7-day grocery and meal plan for ${people} people with a budget of ₹${budget} in Indian Rupees (INR). Dietary preferences: ${preferences}. The image should be structured like an infographic with clear, readable text.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        throw new Error('No image was generated.');
    } catch (error) {
        console.error('Error generating image plan:', error);
        throw error;
    }
};

export const generateVideoPlan = async (
  budget: number,
  people: number,
  preferences: string,
  onProgress: (message: string) => void
): Promise<string> => {
    const prompt = `Create a visually appealing 8-second video summarizing a 7-day grocery and meal plan for ${people} people with a budget of ₹${budget} in Indian Rupees (INR). Dietary preferences: ${preferences}. The video should contain clear, easy-to-read text overlay summarizing the plan.`;
    
    // Create a new instance before API call to ensure fresh API key.
    const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        onProgress('Sending request to generate video...');
        let operation = await videoAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        onProgress('Video generation started. This may take a few minutes...');
        let checks = 0;
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            checks++;
            onProgress(`Checking video status (${checks * 10}s)... Still processing.`);
            operation = await videoAi.operations.getVideosOperation({ operation: operation });
        }

        onProgress('Video processing complete. Fetching video...');
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('Video generation succeeded but no download link was found.');
        }

        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    } catch (error) {
        console.error('Error generating video plan:', error);
        throw error; // Re-throw to be handled in the component.
    }
};

export const getAssistantResponse = async (history: ChatMessage[], expenses: Expense[], incomes: Income[], userProfile: UserProfile | null, newPrompt: string): Promise<string> => {
  const expenseData = JSON.stringify(expenses.slice(0, 20), null, 2);
  const incomeData = JSON.stringify(incomes.slice(0, 20), null, 2);
  const userContext = userProfile 
    ? `The user's name is ${userProfile.name}, they are ${userProfile.age} years old, and they have a household of ${userProfile.familyMembers}.` 
    : '';

  const systemInstruction = `You are a helpful financial assistant for a user in India. ${userContext} Your role is to analyze the user's expense and income data (in Indian Rupees, ₹) and answer their questions about their budget and spending habits.
  Some transactions may have a "recurring": "monthly" property, which means they occur every month. You should factor this into your analysis of their monthly budget.
  Here is the user's recent expense data:
  ${expenseData}
  
  Here is the user's recent income data:
  ${incomeData}

  Keep your answers concise, friendly, and actionable. Address the user by their name if you know it. Analyze both income and expenses to provide holistic advice.`;

  const chat = ai.chats.create({
    model: 'gemini-flash-latest',
    config: {
        systemInstruction: systemInstruction,
    }
  });

  try {
     const response = await chat.sendMessage({ message: newPrompt });
     return response.text;
  } catch (error) {
    console.error('Error getting assistant response:', error);
    throw new Error('Failed to get a response from the assistant. Please try again.');
  }
};

// --- New Recipe Planner Functions ---

export const generateRecipeText = async (
    query: string,
    ingredientsOnHand: string,
    preferences: string
): Promise<Recipe> => {
    const prompt = `You are an expert chef specializing in diverse cuisines, including Indian food. Create a detailed recipe based on the following request.
    Request: "${query}"
    Dietary Preferences: "${preferences}"
    ${ingredientsOnHand ? `The user has these ingredients on hand, try to incorporate them: "${ingredientsOnHand}"` : ''}
    Provide the response as a JSON object. Ensure all fields are filled out appropriately.`;

    try {
        const response = await model.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recipeName: { type: Type.STRING, description: "The name of the recipe." },
                        description: { type: Type.STRING, description: "A short, enticing description of the dish." },
                        prepTime: { type: Type.STRING, description: "Preparation time, e.g., '15 minutes'." },
                        cookTime: { type: Type.STRING, description: "Cooking time, e.g., '30 minutes'." },
                        servings: { type: Type.STRING, description: "Number of servings, e.g., '4 servings'." },
                        ingredients: { type: Type.ARRAY, description: "List of ingredients with quantities.", items: { type: Type.STRING } },
                        instructions: { type: Type.ARRAY, description: "Step-by-step cooking instructions.", items: { type: Type.STRING } },
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as Recipe;
    } catch (error) {
        console.error('Error generating recipe text:', error);
        throw new Error('Failed to generate the recipe. Please try again.');
    }
};

export const generateRecipeImage = async (recipeName: string, recipeDescription: string): Promise<string> => {
    const prompt = `Create a photorealistic, appetizing image of a finished dish: "${recipeName}".
    Description: "${recipeDescription}".
    The image should be well-lit, beautifully plated, and look delicious.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error('No image was generated for the recipe.');
    } catch (error) {
        console.error('Error generating recipe image:', error);
        throw error;
    }
};

export const generateRecipeVideo = async (recipeName: string, onProgress: (message: string) => void): Promise<string> => {
    const prompt = `Create a short, dynamic 8-second video tutorial showing the key steps of making "${recipeName}". Include quick cuts of ingredients being prepped and the final dish.`;
    const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        onProgress('Sending request for recipe video...');
        let operation = await videoAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
        });
        onProgress('Video generation started. This might take a few minutes...');
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            onProgress('Checking video status... still processing.');
            operation = await videoAi.operations.getVideosOperation({ operation: operation });
        }
        onProgress('Fetching your recipe video...');
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error('Video generation failed to return a download link.');
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
        return URL.createObjectURL(await response.blob());
    } catch (error) {
        console.error('Error generating recipe video:', error);
        throw error;
    }
};

export const findGroceryOnline = async (itemName: string): Promise<GroceryLink[]> => {
    const prompt = `Using Google Search, find online shopping links for the grocery item: "${itemName}".
    Focus on popular Indian online grocery stores like BigBasket, Blinkit, Zepto, Swiggy Instamart, and Amazon Fresh.
    Return a JSON array of objects, where each object has a "title" (the store name) and a "uri" (the direct search or product URL).
    Example format: [{"title": "BigBasket", "uri": "https://..."}, {"title": "Amazon Fresh", "uri": "https://..."}]
    Provide up to 3 relevant links. If you cannot find links, return an empty array.
    Your response MUST be only the JSON array. Do not add any other text or markdown formatting.`;

    try {
        const response = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        let text = response.text.trim();
        // The model can sometimes add ```json markdown
        if (text.startsWith('```json')) {
            text = text.substring(7, text.length - 3).trim();
        }
        
        if (text.startsWith('[') && text.endsWith(']')) {
            return JSON.parse(text);
        } else {
            console.warn('AI response was not a valid JSON array:', text);
            return [];
        }
    } catch (error) {
        console.error(`Error finding groceries for ${itemName}:`, error);
        throw new Error('Failed to find groceries online.');
    }
};
