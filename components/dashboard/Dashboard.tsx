
import React from 'react';
import Card from '../ui/Card';
import { useAppState } from '../../context/AppContext';
import { Expense, Income } from '../../types';

const Header: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-on-surface">{title}</h1>
        <p className="text-sm sm:text-base text-on-surface-variant">{subtitle}</p>
    </header>
);

const SummaryCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
    <Card className="flex-1">
        <p className="text-xs sm:text-sm text-on-surface-variant">{title}</p>
        <p className={`text-xl sm:text-2xl lg:text-3xl font-medium ${color}`}>{value}</p>
    </Card>
);

const RecentTransactionItem: React.FC<{ transaction: (Expense & { type: 'expense' }) | (Income & { type: 'income' }) }> = ({ transaction }) => {
    const isExpense = transaction.type === 'expense';
    return (
        <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 py-3 border-b border-outline/20">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-on-surface truncate">
                    {transaction.description}
                    {transaction.recurring && <span className="ml-2 text-xs font-semibold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full align-middle">Monthly</span>}
                </p>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                    {isExpense ? `${transaction.category} · ` : 'Income · '} 
                    {new Date(transaction.date).toLocaleDateString()}
                </p>
            </div>
            <p className={`font-medium text-sm sm:text-base flex-shrink-0 ${isExpense ? 'text-error' : 'text-tertiary'}`}>
                {isExpense ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
        </li>
    );
};

const AlertCard: React.FC<{ type: 'warning' | 'info' | 'success'; title: string; message: string }> = ({ type, title, message }) => {
    const bgColor = type === 'warning' ? 'bg-error-container' : type === 'info' ? 'bg-primary-container' : 'bg-tertiary-container';
    const textColor = type === 'warning' ? 'text-on-error-container' : type === 'info' ? 'text-on-primary-container' : 'text-on-tertiary-container';
    const borderColor = type === 'warning' ? 'border-error' : type === 'info' ? 'border-primary' : 'border-tertiary';
    
    return (
        <Card className={`${bgColor} border-2 ${borderColor} mb-4`}>
            <h3 className={`text-lg font-semibold ${textColor} mb-2`}>{title}</h3>
            <p className={`${textColor} text-sm`}>{message}</p>
        </Card>
    );
};

const SavingsSuggestionCard: React.FC<{ suggestions: string[] }> = ({ suggestions }) => {
    if (suggestions.length === 0) return null;
    
    return (
        <Card className="mb-4 bg-tertiary-container/30 border-2 border-tertiary">
            <h3 className="text-lg font-semibold text-on-surface mb-3">💡 Savings Suggestions</h3>
            <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-on-surface-variant">
                        <span className="text-tertiary mt-1">•</span>
                        <span>{suggestion}</span>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const SavingsVisualization: React.FC<{ savedAmount: number }> = ({ savedAmount }) => {
    const getSavingsEquivalents = (amount: number) => {
        const equivalents = [
            { item: 'Movie Tickets', value: 250, emoji: '🎬' },
            { item: 'Cups of Coffee', value: 50, emoji: '☕' },
            { item: 'Meals at Restaurant', value: 300, emoji: '🍽️' },
            { item: 'Books', value: 400, emoji: '📚' },
            { item: 'Uber Rides', value: 200, emoji: '🚗' },
        ];
        
        return equivalents.map(eq => ({
            ...eq,
            count: Math.floor(amount / eq.value),
        })).filter(eq => eq.count > 0).slice(0, 3);
    };
    
    const equivalents = getSavingsEquivalents(savedAmount);
    
    if (equivalents.length === 0 || savedAmount <= 0) return null;
    
    return (
        <Card className="mb-4 bg-secondary-container/30 border-2 border-secondary">
            <h3 className="text-lg font-semibold text-on-surface mb-3">🎉 Your Savings Could Buy</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {equivalents.map((eq, index) => (
                    <div key={index} className="text-center p-3 bg-surface rounded-lg">
                        <div className="text-2xl mb-1">{eq.emoji}</div>
                        <div className="text-sm font-medium text-on-surface">{eq.count}x</div>
                        <div className="text-xs text-on-surface-variant">{eq.item}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const Dashboard: React.FC = () => {
    const { expenses, incomes, userProfile } = useAppState();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = daysInMonth - currentDay;

    const totalSpent = expenses.reduce((sum, exp) => {
        const expDate = new Date(exp.date);
        const isRecurring = exp.recurring === 'monthly';
        const isOneTimeThisMonth = !isRecurring && expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;

        if (isRecurring || isOneTimeThisMonth) {
            return sum + exp.amount;
        }
        return sum;
    }, 0);
    
    const totalIncome = incomes.reduce((sum, inc) => {
        const incDate = new Date(inc.date);
        const isRecurring = inc.recurring === 'monthly';
        const isOneTimeThisMonth = !isRecurring && incDate.getFullYear() === currentYear && incDate.getMonth() === currentMonth;

        if (isRecurring || isOneTimeThisMonth) {
            return sum + inc.amount;
        }
        return sum;
    }, 0);

    const remainingBalance = totalIncome - totalSpent;
    const averageDailySpending = totalSpent / currentDay;
    const projectedMonthlySpending = averageDailySpending * daysInMonth;
    const projectedOverspending = projectedMonthlySpending - totalIncome;
    const daysUntilOverspending = remainingBalance > 0 && averageDailySpending > 0 
        ? Math.floor(remainingBalance / averageDailySpending) 
        : 0;

    // Generate predictive alerts
    const getPredictiveAlerts = () => {
        const alerts = [];
        
        if (projectedOverspending > 0 && daysUntilOverspending > 0) {
            alerts.push({
                type: 'warning' as const,
                title: '⚠️ Budget Alert',
                message: `At this pace, you'll overshoot your budget by ₹${projectedOverspending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in approximately ${daysUntilOverspending} day${daysUntilOverspending !== 1 ? 's' : ''}. Consider reducing spending.`,
            });
        } else if (remainingBalance < totalIncome * 0.1 && remainingBalance > 0) {
            alerts.push({
                type: 'warning' as const,
                title: '⚠️ Low Budget Remaining',
                message: `You have only ₹${remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining this month. Be mindful of your spending.`,
            });
        } else if (remainingBalance < 0) {
            alerts.push({
                type: 'warning' as const,
                title: '⚠️ Budget Exceeded',
                message: `You've exceeded your monthly budget by ₹${Math.abs(remainingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
            });
        } else if (remainingBalance > totalIncome * 0.3) {
            alerts.push({
                type: 'success' as const,
                title: '✅ Great Job!',
                message: `You're doing well! You have ₹${remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining with ${daysRemaining} days left in the month.`,
            });
        }
        
        return alerts;
    };

    // Generate savings suggestions
    const getSavingsSuggestions = () => {
        const suggestions = [];
        const foodExpenses = expenses
            .filter(exp => exp.category?.toLowerCase().includes('food') || exp.description?.toLowerCase().includes('food') || exp.description?.toLowerCase().includes('restaurant') || exp.description?.toLowerCase().includes('outside'))
            .reduce((sum, exp) => {
                const expDate = new Date(exp.date);
                const isRecurring = exp.recurring === 'monthly';
                const isOneTimeThisMonth = !isRecurring && expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
                return (isRecurring || isOneTimeThisMonth) ? sum + exp.amount : sum;
            }, 0);
        
        if (foodExpenses > totalIncome * 0.2) {
            suggestions.push('Reduce outside food expenses - cooking at home can save 30-40% on food costs');
        }
        
        if (totalSpent > totalIncome * 0.8) {
            suggestions.push('Switch to generic brands for everyday items - can save 15-20% without compromising quality');
            suggestions.push('Buy in bulk for frequently used items - reduces per-unit cost significantly');
        }
        
        if (projectedOverspending > 0) {
            suggestions.push('Review recurring subscriptions and cancel unused services');
            suggestions.push('Plan grocery shopping with a list to avoid impulse purchases');
        }
        
        if (suggestions.length === 0 && remainingBalance > 0) {
            suggestions.push('Consider setting aside 10-20% of remaining balance for emergency fund');
        }
        
        return suggestions;
    };

    const welcomeMessage = userProfile?.name ? `Welcome Back, ${userProfile.name}!` : 'Welcome Back!';
    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const recentTransactions = [
        ...expenses.map(e => ({ ...e, type: 'expense' as const })),
        ...incomes.map(i => ({ ...i, type: 'income' as const }))
    ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

    const alerts = getPredictiveAlerts();
    const savingsSuggestions = getSavingsSuggestions();
    const savedAmount = remainingBalance > 0 ? remainingBalance : 0;

    return (
        <div className="max-w-5xl mx-auto px-2 sm:px-4">
            <Header title={welcomeMessage} subtitle="Here's a snapshot of your current monthly budget." />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <SummaryCard title="Monthly Income" value={formatCurrency(totalIncome)} color="text-tertiary" />
                <SummaryCard title="Monthly Spent" value={formatCurrency(totalSpent)} color="text-error" />
                <SummaryCard title="Remaining This Month" value={formatCurrency(remainingBalance)} color={remainingBalance >= 0 ? "text-on-surface" : "text-error"} />
            </div>

            {/* Predictive Alerts */}
            {alerts.map((alert, index) => (
                <AlertCard key={index} type={alert.type} title={alert.title} message={alert.message} />
            ))}

            {/* Savings Visualization */}
            {savedAmount > 0 && <SavingsVisualization savedAmount={savedAmount} />}

            {/* Savings Suggestions */}
            {savingsSuggestions.length > 0 && <SavingsSuggestionCard suggestions={savingsSuggestions} />}

            <Card>
                <h2 className="text-lg sm:text-xl font-medium text-on-surface-variant mb-4">Recent Transactions Logged</h2>
                {recentTransactions.length > 0 ? (
                    <ul>
                        {recentTransactions.map(t => (
                            <RecentTransactionItem key={`${t.type}-${t.id}`} transaction={t} />
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-on-surface-variant py-8">You haven't logged any transactions yet.</p>
                )}
            </Card>
        </div>
    );
};

export default Dashboard;