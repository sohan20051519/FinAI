
export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  recurring?: 'monthly';
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  date: string;
  recurring?: 'monthly';
}

export interface Meal {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface GroceryItem {
  item: string;
  quantity: string;
  category: string;
}

export interface MealPlan {
  mealPlan: Meal[];
  groceryList: GroceryItem[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

export interface UserProfile {
  name: string;
  age: number;
  familyMembers: number;
}

export interface Recipe {
  recipeName: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
}

export interface GroceryLink {
  title: string;
  uri: string;
  // Optional numeric price in INR for comparison; null if unavailable
  price?: number | null;
}

export interface OnlineGroceryResult {
  links: GroceryLink[];
}

// New healthy product launches (static suggestions)
export interface HealthyProductLaunch {
  id: string;
  name: string;
  category: string; // e.g., snack, oil, staple
  healthBenefit: string; // e.g., low cholesterol
  priceINR: number; // approximate price
  launchDate: string; // ISO date string
  imageUrl: string;
  sourceUrl: string;
}
