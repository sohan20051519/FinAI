
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { ChatMessage, Expense, MealPlan, UserProfile, Income, Recipe, GroceryLink } from '../types';

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("API_KEY or GEMINI_API_KEY environment variable not set. Please create a .env file with your Gemini API key.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });
const model = ai.models;

const getRegionalContext = (region: string): string => {
  const regionalContexts: Record<string, string> = {
    north: `North Indian cuisine: Focus on roti, paratha, dal, sabzi, biryani, tandoori items. Common ingredients: wheat flour, basmati rice, paneer, lentils (dal), ghee, yogurt, spices like garam masala, cumin, coriander. Regional dishes: rajma, chole, butter chicken, paneer tikka, aloo gobi, kadhi, kheer. Breakfast typically includes paratha, puri, halwa, chole bhature.`,
    south: `South Indian cuisine: Focus on rice, dosa, idli, sambar, rasam, coconut-based curries. Common ingredients: rice, urad dal, toor dal, coconut, curry leaves, tamarind, mustard seeds, fenugreek. Regional dishes: dosa, idli, vada, sambar, rasam, coconut chutney, biryani, fish curry, avial, payasam. Breakfast typically includes idli, dosa, upma, pongal.`,
    east: `East Indian cuisine: Focus on rice, fish, mustard oil, sweets, fermented foods. Common ingredients: rice, fish, mustard oil, mustard seeds, poppy seeds, coconut, jaggery, milk. Regional dishes: macher jhol (fish curry), roshogolla, mishti doi, sandesh, luchi, cholar dal, shukto, doi maach. Breakfast typically includes luchi, aloo dum, poha, chire.`,
    west: `West Indian cuisine: Focus on diverse regional dishes from Maharashtra, Gujarat, Rajasthan. Common ingredients: wheat, jowar, bajra, peanuts, coconut, kokum, jaggery, various lentils. Regional dishes: pav bhaji, vada pav, dhokla, thepla, dal baati, kadhi, thalipeeth, puran poli, modak. Breakfast typically includes poha, upma, paratha, dhokla, thepla.`,
    northeast: `Northeast Indian cuisine: Focus on rice, bamboo shoots, fermented foods, meat, minimal oil. Common ingredients: rice, bamboo shoots, fermented soybeans, fish, pork, duck, green chilies, local herbs, mustard oil. Regional dishes: momos, thukpa, fish curry, pork curry, bamboo shoot pickle, axone, khar, tenga. Breakfast typically includes rice, tea, local snacks.`,
    central: `Central Indian cuisine: Focus on wheat, rice, dal, vegetables, spicy curries. Common ingredients: wheat flour, rice, lentils, vegetables, ghee, spices, besan. Regional dishes: dal bafla, poha, jalebi, kachori, bhutte ki kees, sabudana khichdi, malpua. Breakfast typically includes poha, kachori, jalebi, paratha.`,
    other: `General Indian cuisine: Include a mix of popular Indian dishes from various regions. Focus on common ingredients available across India.`,
  };
  return regionalContexts[region] || regionalContexts.other;
};

export const generateGroceryPlan = async (
  budget: number,
  people: number,
  preferences: string,
  region: string
): Promise<MealPlan> => {
  const regionalContext = getRegionalContext(region);
  
  const prompt = `Create a 7-day meal plan and a corresponding grocery list for ${people} people with a budget of ₹${budget} in Indian Rupees (INR). 
  
  Regional Context: ${regionalContext}
  
  Dietary preferences: ${preferences}. 
  
  IMPORTANT REGIONAL CUSTOMIZATION:
  - Use ingredients commonly available and affordable in the selected region
  - Include traditional dishes and cooking methods from that region
  - Consider regional price variations for ingredients
  - Use regional spice blends and flavor profiles
  - Match regional meal patterns (breakfast, lunch, dinner styles)
  - Include regional snacks and accompaniments
  
  The meal plan should include breakfast, lunch, and dinner for each day, reflecting the regional cuisine style.
  The grocery list should be categorized (e.g., Produce, Dairy, Meat, Spices, Grains, Pantry) and include ingredients that are:
  1. Commonly available in local markets of the selected region
  2. Priced appropriately for the regional market
  3. Used in traditional regional cooking
  4. Seasonal and fresh in that region
  
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
  preferences: string,
  region: string
): Promise<string> => {
    const regionalContext = getRegionalContext(region);
    const prompt = `Create a visually appealing single image that summarizes a 7-day grocery and meal plan for ${people} people with a budget of ₹${budget} in Indian Rupees (INR). 
    
    Regional Context: ${regionalContext}
    Dietary preferences: ${preferences}. 
    
    The image should reflect the regional cuisine style and include visual elements that represent the selected region's food culture. The image should be structured like an infographic with clear, readable text showing regional dishes and ingredients.`;

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
  region: string,
  onProgress: (message: string) => void
): Promise<string> => {
    const regionalContext = getRegionalContext(region);
    const prompt = `Create a visually appealing 8-second video summarizing a 7-day grocery and meal plan for ${people} people with a budget of ₹${budget} in Indian Rupees (INR). 
    
    Regional Context: ${regionalContext}
    Dietary preferences: ${preferences}. 
    
    The video should reflect the regional cuisine style with visual elements representing the selected region's food culture. The video should contain clear, easy-to-read text overlay summarizing the plan, highlighting regional dishes and ingredients.`;
    
    // Create a new instance before API call to ensure fresh API key.
    const videoAi = new GoogleGenAI({ apiKey: apiKey });

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

        const response = await fetch(`${downloadLink}&key=${apiKey}`);
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

  const systemInstruction = `You are FinAI, a helpful financial assistant for a user in India. ${userContext} Your role is to analyze the user's expense and income data (in Indian Rupees, ₹) and answer their questions about their budget and spending habits.
  Some transactions may have a "recurring": "monthly" property, which means they occur every month. You should factor this into your analysis of their monthly budget.
  Here is the user's recent expense data:
  ${expenseData}
  
  Here is the user's recent income data:
  ${incomeData}

  Keep your answers concise, friendly, and actionable. Address the user by their name if you know it. Analyze both income and expenses to provide holistic advice. Use emojis sparingly to make responses more engaging.`;

  // Convert history to the format expected by Gemini API
  // Skip the first message if it's the greeting (to avoid duplicate context)
  const conversationHistory = history
    .filter((msg, index) => index > 0 || msg.role !== 'model') // Skip initial greeting
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

  const chat = ai.chats.create({
    model: 'gemini-flash-latest',
    config: {
        systemInstruction: systemInstruction,
    },
    history: conversationHistory.length > 0 ? conversationHistory : undefined
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
    const videoAi = new GoogleGenAI({ apiKey: apiKey });
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
        const response = await fetch(`${downloadLink}&key=${apiKey}`);
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
