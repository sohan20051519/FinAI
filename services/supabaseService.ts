import { supabase } from '../lib/supabase';
import { UserProfile, FixedExpense, Expense, Income } from '../types';

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

