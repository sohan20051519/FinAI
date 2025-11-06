import { supabase } from '../lib/supabase';
import { UserProfile, FixedExpense, Expense, Income, MealPlan, ChatMessage, Recipe, GroceryItem } from '../types';

// User Profile Operations
export const userProfileService = {
  // Get user profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  // Create or update user profile
  async upsertProfile(userId: string, profile: UserProfile & { monthlyIncome: number; onboardingComplete: boolean }) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        name: profile.name,
        age: profile.age,
        family_members: profile.familyMembers,
        monthly_income: profile.monthlyIncome,
        onboarding_complete: profile.onboardingComplete,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving profile:', error);
      throw error;
    }

    return data;
  },
};

// Fixed Expenses Operations
export const fixedExpensesService = {
  // Get fixed expenses for a user
  async getFixedExpenses(userId: string) {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fixed expenses:', error);
      return [];
    }

    return data.map(exp => ({
      id: exp.id,
      name: exp.name,
      amount: exp.amount,
    }));
  },

  // Save fixed expenses (replace all)
  async saveFixedExpenses(userId: string, fixedExpenses: FixedExpense[]) {
    // Delete existing fixed expenses
    await supabase
      .from('fixed_expenses')
      .delete()
      .eq('user_id', userId);

    if (fixedExpenses.length === 0) return [];

    // Insert new fixed expenses
    const { data, error } = await supabase
      .from('fixed_expenses')
      .insert(
        fixedExpenses.map(exp => ({
          user_id: userId,
          name: exp.name,
          amount: exp.amount,
        }))
      )
      .select();

    if (error) {
      console.error('Error saving fixed expenses:', error);
      throw error;
    }

    return data.map(exp => ({
      id: exp.id,
      name: exp.name,
      amount: exp.amount,
    }));
  },
};

// Expenses Operations
export const expensesService = {
  // Get expenses for a user
  async getExpenses(userId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }

    return data.map(exp => ({
      id: exp.id,
      amount: exp.amount,
      category: exp.category,
      date: exp.date,
      description: exp.description,
      recurring: exp.recurring || undefined,
    }));
  },

  // Add expense
  async addExpense(userId: string, expense: Expense) {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        description: expense.description,
        recurring: expense.recurring || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      throw error;
    }

    return {
      id: data.id,
      amount: data.amount,
      category: data.category,
      date: data.date,
      description: data.description,
      recurring: data.recurring || undefined,
    };
  },

  // Delete expense
  async deleteExpense(userId: string, expenseId: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },
};

// Incomes Operations
export const incomesService = {
  // Get incomes for a user
  async getIncomes(userId: string) {
    const { data, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching incomes:', error);
      return [];
    }

    return data.map(inc => ({
      id: inc.id,
      amount: inc.amount,
      description: inc.description,
      date: inc.date,
      recurring: inc.recurring || undefined,
    }));
  },

  // Add income
  async addIncome(userId: string, income: Income) {
    const { data, error } = await supabase
      .from('incomes')
      .insert({
        user_id: userId,
        amount: income.amount,
        description: income.description,
        date: income.date,
        recurring: income.recurring || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding income:', error);
      throw error;
    }

    return {
      id: data.id,
      amount: data.amount,
      description: data.description,
      date: data.date,
      recurring: data.recurring || undefined,
    };
  },

  // Delete income
  async deleteIncome(userId: string, incomeId: string) {
    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', incomeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  },

  // Save initial income (replace if exists)
  async saveInitialIncome(userId: string, income: Income) {
    // Delete existing initial income
    await supabase
      .from('incomes')
      .delete()
      .eq('user_id', userId)
      .eq('description', income.description)
      .eq('recurring', 'monthly');

    // Insert new initial income
    return await this.addIncome(userId, income);
  },
};

// Meal Plans Operations
export const mealPlansService = {
  // Get all meal plans for a user
  async getMealPlans(userId: string) {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meal plans:', error);
      return [];
    }

    return data.map(plan => ({
      id: plan.id,
      name: plan.name,
      mealPlan: plan.meal_plan as MealPlan,
      budget: plan.budget,
      people: plan.people,
      region: plan.region,
      preferences: plan.preferences,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
    }));
  },

  // Get a single meal plan
  async getMealPlan(userId: string, planId: string) {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching meal plan:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      mealPlan: data.meal_plan as MealPlan,
      budget: data.budget,
      people: data.people,
      region: data.region,
      preferences: data.preferences,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Save a meal plan
  async saveMealPlan(
    userId: string,
    mealPlan: MealPlan,
    name: string,
    budget?: number,
    people?: number,
    region?: string,
    preferences?: string,
    planId?: string
  ) {
    const planData: any = {
      user_id: userId,
      name,
      meal_plan: mealPlan,
      budget: budget || null,
      people: people || null,
      region: region || null,
      preferences: preferences || null,
      updated_at: new Date().toISOString(),
    };

    if (planId) {
      // Update existing plan
      const { data, error } = await supabase
        .from('meal_plans')
        .update(planData)
        .eq('id', planId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating meal plan:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        mealPlan: data.meal_plan as MealPlan,
        budget: data.budget,
        people: data.people,
        region: data.region,
        preferences: data.preferences,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } else {
      // Create new plan
      const { data, error } = await supabase
        .from('meal_plans')
        .insert(planData)
        .select()
        .single();

      if (error) {
        console.error('Error saving meal plan:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        mealPlan: data.meal_plan as MealPlan,
        budget: data.budget,
        people: data.people,
        region: data.region,
        preferences: data.preferences,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  },

  // Delete a meal plan
  async deleteMealPlan(userId: string, planId: string) {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting meal plan:', error);
      throw error;
    }
  },
};

// Chat Messages Operations
export const chatMessagesService = {
  // Get chat messages for a user (there's only one chat per user)
  async getChatMessages(userId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching chat messages:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      messages: data.messages as ChatMessage[],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Save chat messages (upsert - one chat per user)
  async saveChatMessages(userId: string, messages: ChatMessage[]) {
    const { data: existing } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('user_id', userId)
      .single();

    const chatData: any = {
      user_id: userId,
      messages: messages,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing chat
      const { data, error } = await supabase
        .from('chat_messages')
        .update(chatData)
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat messages:', error);
        throw error;
      }

      return {
        id: data.id,
        messages: data.messages as ChatMessage[],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } else {
      // Create new chat
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(chatData)
        .select()
        .single();

      if (error) {
        console.error('Error saving chat messages:', error);
        throw error;
      }

      return {
        id: data.id,
        messages: data.messages as ChatMessage[],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  },

  // Delete chat messages
  async deleteChatMessages(userId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting chat messages:', error);
      throw error;
    }
  },
};

// Recipes Operations
export const recipesService = {
  // Get all recipes for a user
  async getRecipes(userId: string) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }

    return data.map(recipe => ({
      id: recipe.id,
      name: recipe.name,
      recipe: recipe.recipe as Recipe,
      ingredients: recipe.ingredients,
      preferences: recipe.preferences,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
    }));
  },

  // Get a single recipe
  async getRecipe(userId: string, recipeId: string) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      recipe: data.recipe as Recipe,
      ingredients: data.ingredients,
      preferences: data.preferences,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Save a recipe
  async saveRecipe(
    userId: string,
    recipe: Recipe,
    name: string,
    ingredients?: string,
    preferences?: string,
    recipeId?: string
  ) {
    const recipeData: any = {
      user_id: userId,
      name,
      recipe: recipe,
      ingredients: ingredients || null,
      preferences: preferences || null,
      updated_at: new Date().toISOString(),
    };

    if (recipeId) {
      // Update existing recipe
      const { data, error } = await supabase
        .from('recipes')
        .update(recipeData)
        .eq('id', recipeId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating recipe:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        recipe: data.recipe as Recipe,
        ingredients: data.ingredients,
        preferences: data.preferences,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } else {
      // Create new recipe
      const { data, error } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select()
        .single();

      if (error) {
        console.error('Error saving recipe:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        recipe: data.recipe as Recipe,
        ingredients: data.ingredients,
        preferences: data.preferences,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  },

  // Delete a recipe
  async deleteRecipe(userId: string, recipeId: string) {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  },
};

// Grocery Lists Operations
export const groceryListsService = {
  // Get all grocery lists for a user
  async getGroceryLists(userId: string) {
    const { data, error } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching grocery lists:', error);
      return [];
    }

    return data.map(list => ({
      id: list.id,
      name: list.name,
      items: list.items as GroceryItem[],
      createdAt: list.created_at,
      updatedAt: list.updated_at,
    }));
  },

  // Get a single grocery list
  async getGroceryList(userId: string, listId: string) {
    const { data, error } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('id', listId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching grocery list:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      items: data.items as GroceryItem[],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Save a grocery list
  async saveGroceryList(
    userId: string,
    items: GroceryItem[],
    name: string,
    listId?: string
  ) {
    const listData: any = {
      user_id: userId,
      name,
      items: items,
      updated_at: new Date().toISOString(),
    };

    if (listId) {
      // Update existing list
      const { data, error } = await supabase
        .from('grocery_lists')
        .update(listData)
        .eq('id', listId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating grocery list:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        items: data.items as GroceryItem[],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } else {
      // Create new list
      const { data, error } = await supabase
        .from('grocery_lists')
        .insert(listData)
        .select()
        .single();

      if (error) {
        console.error('Error saving grocery list:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        items: data.items as GroceryItem[],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  },

  // Delete a grocery list
  async deleteGroceryList(userId: string, listId: string) {
    const { error } = await supabase
      .from('grocery_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting grocery list:', error);
      throw error;
    }
  },
};

