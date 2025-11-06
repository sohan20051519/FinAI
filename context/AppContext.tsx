import React, { createContext, useReducer, useContext, Dispatch, ReactNode } from 'react';
import { Expense, FixedExpense, UserProfile, Income } from '../types';

interface AppState {
  expenses: Expense[];
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  userProfile: UserProfile | null;
  isOnboardingComplete: boolean;
  isAuthenticated: boolean;
  authUser: { name: string; email: string } | null;
}

type Action =
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_INCOME'; payload: Income }
  | { type: 'DELETE_INCOME'; payload: string }
  | { type: 'INITIALIZE_APP'; payload: { userProfile: UserProfile; monthlyIncome: number; fixedExpenses: FixedExpense[] } }
  | { type: 'LOAD_USER_DATA'; payload: { userProfile: UserProfile; monthlyIncome: number; fixedExpenses: FixedExpense[]; expenses: Expense[]; incomes: Income[]; isOnboardingComplete: boolean } }
  | { type: 'SIGN_IN'; payload: { name: string; email: string } }
  | { type: 'SIGN_UP'; payload: { name: string; email: string } }
  | { type: 'SIGN_OUT' };

const initialState: AppState = {
  expenses: [],
  incomes: [],
  fixedExpenses: [],
  userProfile: null,
  isOnboardingComplete: false,
  isAuthenticated: false,
  authUser: null,
};

const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<Action>>(() => null);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [action.payload, ...state.expenses],
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.id !== action.payload),
      };
    case 'ADD_INCOME':
      return {
        ...state,
        incomes: [action.payload, ...state.incomes],
      };
    case 'DELETE_INCOME':
      return {
        ...state,
        incomes: state.incomes.filter(income => income.id !== action.payload),
      };
    case 'INITIALIZE_APP': {
      const { userProfile, monthlyIncome, fixedExpenses } = action.payload;
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const initialIncome: Income = {
        id: `income-${today.toISOString()}`,
        amount: monthlyIncome,
        description: 'Monthly Income',
        date: todayString,
        recurring: 'monthly',
      };

      const recurringExpenses: Expense[] = fixedExpenses.map(fe => ({
          id: `expense-${fe.id}`,
          amount: fe.amount,
          category: 'Other',
          description: fe.name,
          date: todayString,
          recurring: 'monthly',
      }));

      return {
        ...state,
        userProfile,
        fixedExpenses,
        incomes: [initialIncome],
        expenses: recurringExpenses,
        isOnboardingComplete: true,
      };
    }
    case 'LOAD_USER_DATA': {
      const { userProfile, monthlyIncome, fixedExpenses, expenses, incomes, isOnboardingComplete } = action.payload;
      return {
        ...state,
        userProfile,
        fixedExpenses,
        expenses,
        incomes,
        isOnboardingComplete,
      };
    }
    case 'SIGN_IN':
      return {
        ...state,
        isAuthenticated: true,
        authUser: action.payload,
      };
    case 'SIGN_UP':
      return {
        ...state,
        isAuthenticated: true,
        authUser: action.payload,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isAuthenticated: false,
        authUser: null,
        isOnboardingComplete: false,
        userProfile: null,
        expenses: [],
        incomes: [],
        fixedExpenses: [],
      };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = () => useContext(AppStateContext);
export const useAppDispatch = () => useContext(AppDispatchContext);