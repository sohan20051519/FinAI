
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
}

export interface OnlineGroceryResult {
  links: GroceryLink[];
}
