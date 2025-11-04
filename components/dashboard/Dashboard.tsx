
import React from 'react';
import Card from '../ui/Card';
import { useAppState } from '../../context/AppContext';
import { Expense, Income } from '../../types';

const Header: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <header className="mb-8">
        <h1 className="text-4xl font-normal text-on-surface">{title}</h1>
        <p className="text-base text-on-surface-variant">{subtitle}</p>
    </header>
);

const SummaryCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
    <Card className="flex-1">
        <p className="text-sm text-on-surface-variant">{title}</p>
        <p className={`text-3xl font-medium ${color}`}>{value}</p>
    </Card>
);

const RecentTransactionItem: React.FC<{ transaction: (Expense & { type: 'expense' }) | (Income & { type: 'income' }) }> = ({ transaction }) => {
    const isExpense = transaction.type === 'expense';
    return (
        <li className="flex justify-between items-center py-3 border-b border-outline/20">
            <div>
                <p className="font-medium text-on-surface">
                    {transaction.description}
                    {transaction.recurring && <span className="ml-2 text-xs font-semibold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full align-middle">Monthly</span>}
                </p>
                <p className="text-sm text-on-surface-variant">
                    {isExpense ? `${transaction.category} · ` : 'Income · '} 
                    {new Date(transaction.date).toLocaleDateString()}
                </p>
            </div>
            <p className={`font-medium ${isExpense ? 'text-error' : 'text-tertiary'}`}>
                {isExpense ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
        </li>
    );
};

const Dashboard: React.FC = () => {
    const { expenses, incomes, userProfile } = useAppState();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

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

    const welcomeMessage = userProfile?.name ? `Welcome Back, ${userProfile.name}!` : 'Welcome Back!';
    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const recentTransactions = [
        ...expenses.map(e => ({ ...e, type: 'expense' as const })),
        ...incomes.map(i => ({ ...i, type: 'income' as const }))
    ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

    return (
        <div className="max-w-5xl mx-auto">
            <Header title={welcomeMessage} subtitle="Here's a snapshot of your current monthly budget." />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <SummaryCard title="Monthly Income" value={formatCurrency(totalIncome)} color="text-tertiary" />
                <SummaryCard title="Monthly Spent" value={formatCurrency(totalSpent)} color="text-error" />
                <SummaryCard title="Remaining This Month" value={formatCurrency(remainingBalance)} color={remainingBalance >= 0 ? "text-on-surface" : "text-error"} />
            </div>

            <Card>
                <h2 className="text-xl font-medium text-on-surface-variant mb-4">Recent Transactions Logged</h2>
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