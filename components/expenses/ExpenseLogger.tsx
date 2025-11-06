
import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Expense, Income } from '../../types';
import { EXPENSE_CATEGORIES } from '../../constants';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { TrashIcon } from '../icons/Icons';
import { supabase } from '../../lib/supabase';
import { expensesService, incomesService } from '../../services/supabaseService';

const Header: React.FC<{ title: string }> = ({ title }) => (
    <header className="mb-8">
        <h1 className="text-4xl font-normal text-on-surface">{title}</h1>
    </header>
);

const ExpenseForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    setIsSaving(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated. Please sign in again.');
      }

      const newExpense: Expense = {
        id: new Date().toISOString(),
        amount: parseFloat(amount),
        category,
        description,
        date,
      };
      if (isRecurring) {
        newExpense.recurring = 'monthly';
      }

      // Save to Supabase first
      const savedExpense = await expensesService.addExpense(user.id, newExpense);

      // Update local state with the saved expense (which has the database ID)
      dispatch({ type: 'ADD_EXPENSE', payload: savedExpense });
      
      // Clear form
      setAmount('');
      setDescription('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setIsRecurring(false);
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setError(err.message || 'Failed to save expense. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface placeholder:text-on-surface-variant"
          required
          />
          <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface"
          >
          {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
              {cat}
              </option>
          ))}
          </select>
      </div>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface placeholder:text-on-surface-variant"
        required
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface"
        required
      />
      <div className="flex items-center">
        <input
            id="recurring-expense"
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="recurring-expense" className="ml-2 block text-sm text-on-surface-variant">
            This is a recurring monthly expense
        </label>
      </div>
      {error && (
        <div className="bg-error-container border border-error rounded-lg p-2 sm:p-2.5">
          <p className="text-[10px] sm:text-xs text-error">{error}</p>
        </div>
      )}
      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Add Expense'}
      </Button>
    </form>
  );
};

const IncomeForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRecurring, setIsRecurring] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || isNaN(parseFloat(amount))) return;
  
      setIsSaving(true);
      setError(null);

      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('User not authenticated. Please sign in again.');
        }

        const newIncome: Income = {
          id: new Date().toISOString(),
          amount: parseFloat(amount),
          description,
          date,
        };
        if (isRecurring) {
          newIncome.recurring = 'monthly';
        }

        // Save to Supabase first
        const savedIncome = await incomesService.addIncome(user.id, newIncome);

        // Update local state with the saved income (which has the database ID)
        dispatch({ type: 'ADD_INCOME', payload: savedIncome });
        
        // Clear form
        setAmount('');
        setDescription('');
        setIsRecurring(false);
      } catch (err: any) {
        console.error('Error saving income:', err);
        setError(err.message || 'Failed to save income. Please try again.');
      } finally {
        setIsSaving(false);
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface placeholder:text-on-surface-variant"
            required
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (e.g., Salary, Freelance)"
            className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface placeholder:text-on-surface-variant"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface"
            required
          />
        <div className="flex items-center">
            <input
                id="recurring-income"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="recurring-income" className="ml-2 block text-sm text-on-surface-variant">
                This is a recurring monthly income
            </label>
        </div>
        {error && (
          <div className="bg-error-container border border-error rounded-lg p-2 sm:p-2.5">
            <p className="text-[10px] sm:text-xs text-error">{error}</p>
          </div>
        )}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Add Income'}
        </Button>
      </form>
    );
};

const TransactionList: React.FC = () => {
    const { expenses, incomes } = useAppState();
    const dispatch = useAppDispatch();
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortOrder, setSortOrder] = useState('date-desc');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async (id: string, type: 'income' | 'expense', description: string) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}: "${description}"?`)) {
            return;
        }

        setDeletingId(id);
        setError(null);

        try {
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('User not authenticated. Please sign in again.');
            }

            // Delete from Supabase
            if (type === 'expense') {
                await expensesService.deleteExpense(user.id, id);
                dispatch({ type: 'DELETE_EXPENSE', payload: id });
            } else {
                await incomesService.deleteIncome(user.id, id);
                dispatch({ type: 'DELETE_INCOME', payload: id });
            }
        } catch (err: any) {
            console.error('Error deleting transaction:', err);
            setError(err.message || 'Failed to delete transaction. Please try again.');
            // Show error for a few seconds
            setTimeout(() => setError(null), 5000);
        } finally {
            setDeletingId(null);
        }
    };

    const displayedTransactions = useMemo(() => {
        let filteredExpenses = expenses;
        if (filterCategory !== 'All') {
            filteredExpenses = expenses.filter(exp => exp.category === filterCategory);
        }

        const combined = [
            ...filteredExpenses.map(e => ({ ...e, type: 'expense' as const })),
            ...incomes.map(i => ({ ...i, type: 'income' as const }))
        ];

        return combined.sort((a, b) => {
            switch (sortOrder) {
                case 'date-asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                case 'date-desc':
                default:
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });
    }, [expenses, incomes, filterCategory, sortOrder]);

    const getEmptyStateMessage = () => {
        if (expenses.length === 0 && incomes.length === 0) {
            return "You haven't logged any transactions yet. Add one using the form above!";
        }
        if (displayedTransactions.length === 0) {
            return "No transactions found for the selected filters.";
        }
        return "";
    }

    return (
        <Card className="mt-8">
            <h2 className="text-xl font-medium text-on-surface-variant mb-4">Transaction History</h2>
            
            {error && (
                <div className="bg-error-container border border-error rounded-lg p-2 sm:p-2.5 mb-4">
                    <p className="text-[10px] sm:text-xs text-error">{error}</p>
                </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="filterCategory" className="block text-sm font-medium text-on-surface-variant mb-1">Filter by Expense Category</label>
                    <select
                        id="filterCategory"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface"
                    >
                        <option value="All">All Categories</option>
                        {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label htmlFor="sortOrder" className="block text-sm font-medium text-on-surface-variant mb-1">Sort by</label>
                    <select
                        id="sortOrder"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface"
                    >
                        <option value="date-desc">Date (Newest first)</option>
                        <option value="date-asc">Date (Oldest first)</option>
                        <option value="amount-desc">Amount (High to Low)</option>
                        <option value="amount-asc">Amount (Low to High)</option>
                    </select>
                </div>
            </div>

            <ul className="divide-y divide-outline/20">
                {displayedTransactions.length > 0 ? displayedTransactions.map(t => (
                    <li key={`${t.type}-${t.id}`} className="flex justify-between items-center py-4 gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-on-surface truncate flex items-center" title={t.description}>
                                {t.description}
                                {t.recurring && <span className="ml-2 text-xs font-semibold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full">Monthly</span>}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                                {t.type === 'expense' ? `${t.category} · ` : 'Income · '}
                                {new Date(t.date).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <p className={`font-medium text-right w-28 ${t.type === 'expense' ? 'text-error' : 'text-tertiary'}`}>
                                {t.type === 'expense' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <button 
                                onClick={() => handleDelete(t.id, t.type, t.description)} 
                                disabled={deletingId === t.id}
                                className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed" 
                                aria-label={`Delete transaction: ${t.description}`}
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </li>
                )) : (
                    <p className="text-center text-on-surface-variant py-8">{getEmptyStateMessage()}</p>
                )}
            </ul>
        </Card>
    )
}

const TransactionLogger: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  return (
    <div className="max-w-3xl mx-auto">
      <Header title="Log Transactions" />
      <Card>
        <div className="flex border-b border-outline/30 mb-4">
            <button 
                onClick={() => setActiveTab('expense')} 
                className={`flex-1 py-2 text-center font-medium ${activeTab === 'expense' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}
            >
                Log Expense
            </button>
            <button 
                onClick={() => setActiveTab('income')}
                className={`flex-1 py-2 text-center font-medium ${activeTab === 'income' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}
            >
                Log Income
            </button>
        </div>
        {activeTab === 'expense' ? <ExpenseForm /> : <IncomeForm />}
      </Card>
      <TransactionList />
    </div>
  );
};

export default TransactionLogger;