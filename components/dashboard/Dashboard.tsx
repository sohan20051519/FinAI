
import React from 'react';
import Card from '../ui/Card';
import { useAppState } from '../../context/AppContext';
import { Expense, Income } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell as RechartsCell } from 'recharts';

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

const SavingsSuggestionCard: React.FC<{ suggestions: Array<{
    category: string;
    suggestion: string;
    potentialSaving: number;
    difficulty: string;
    icon: string;
    priority: string;
}> }> = ({ suggestions }) => {
    if (suggestions.length === 0) return null;
    
    return (
        <Card className="mb-4 bg-tertiary-container/30 border-2 border-tertiary">
            <h3 className="text-lg font-semibold text-on-surface mb-3">💡 Investment-Focused Savings</h3>
            <div className="space-y-3">
                {suggestions.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-surface/50 rounded-lg border border-outline/20">
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-on-surface">{item.category}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    item.priority === 'High' ? 'bg-error-container text-error' :
                                    item.priority === 'Medium' ? 'bg-warning-container text-warning' :
                                    'bg-info-container text-info'
                                }`}>
                                    {item.priority}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    item.difficulty === 'Easy' ? 'bg-success-container text-success' :
                                    'bg-surface-variant text-on-surface-variant'
                                }`}>
                                    {item.difficulty}
                                </span>
                            </div>
                            <p className="text-sm text-on-surface-variant mb-2">{item.suggestion}</p>
                            <p className="text-xs text-tertiary font-medium">
                                Potential Annual Benefit: ₹{item.potentialSaving.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const SavingsVisualization: React.FC<{ savedAmount: number }> = ({ savedAmount }) => {
    const getSavingsEquivalents = (amount: number) => {
        const equivalents = [
            // Investment opportunities
            { item: 'Months of SIP Investment', value: 500, emoji: '📈', category: 'investment' },
            { item: 'Gold Grams', value: 6000, emoji: '🥇', category: 'investment' },
            { item: 'Mutual Fund Units', value: 1000, emoji: '📊', category: 'investment' },
            { item: 'Fixed Deposit Months', value: 10000, emoji: '🏦', category: 'investment' },
            
            // Smart savings
            { item: 'Weeks of Groceries', value: 2000, emoji: '🛒', category: 'savings' },
            { item: 'Months of Electricity', value: 1500, emoji: '💡', category: 'utilities' },
            { item: 'Weeks of Fuel', value: 3000, emoji: '⛽', category: 'transport' },
            { item: 'Months of Internet', value: 800, emoji: '📶', category: 'utilities' },
            
            // Lifestyle upgrades
            { item: 'Online Courses', value: 999, emoji: '🎓', category: 'education' },
            { item: 'Gym Membership Months', value: 1200, emoji: '💪', category: 'health' },
            { item: 'Medical Checkups', value: 2500, emoji: '🏥', category: 'health' },
            { item: 'Weekend Trips', value: 5000, emoji: '🏖️', category: 'travel' },
        ];
        
        return equivalents.map(eq => ({
            ...eq,
            count: Math.floor(amount / eq.value),
        })).filter(eq => eq.count > 0).slice(0, 4);
    };
    
    const equivalents = getSavingsEquivalents(savedAmount);
    
    if (equivalents.length === 0 || savedAmount <= 0) return null;
    
    const investmentOptions = equivalents.filter(eq => eq.category === 'investment');
    const otherOptions = equivalents.filter(eq => eq.category !== 'investment');
    
    return (
        <Card className="mb-6 bg-gradient-to-r from-secondary-container to-tertiary-container border-2 border-secondary/50">
            <h3 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                Your Savings Could Fund
            </h3>
            
            {investmentOptions.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-on-surface-variant mb-2 flex items-center gap-1">
                        <span className="text-lg">💰</span>
                        Investment Opportunities
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {investmentOptions.map((eq, index) => (
                            <div key={index} className="text-center p-4 bg-surface/80 rounded-lg border border-secondary/20 hover:shadow-md transition-shadow">
                                <div className="text-3xl mb-2">{eq.emoji}</div>
                                <div className="text-lg font-bold text-on-surface">{eq.count}</div>
                                <div className="text-sm text-on-surface-variant font-medium">{eq.item}</div>
                                <div className="text-xs text-primary mt-1">
                                    Value: ₹{(eq.count * eq.value).toLocaleString('en-IN')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {otherOptions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-on-surface-variant mb-2 flex items-center gap-1">
                        <span className="text-lg">🎯</span>
                        Smart Spending Alternatives
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {otherOptions.map((eq, index) => (
                            <div key={index} className="text-center p-3 bg-surface/60 rounded-lg border border-outline/20 hover:shadow-sm transition-shadow">
                                <div className="text-2xl mb-1">{eq.emoji}</div>
                                <div className="text-base font-semibold text-on-surface">{eq.count}x</div>
                                <div className="text-xs text-on-surface-variant">{eq.item}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="mt-4 p-3 bg-primary-container/30 rounded-lg border border-primary/20">
                <p className="text-sm text-on-surface-variant text-center">
                    💡 <strong>Pro Tip:</strong> Consider investing {Math.min(20, Math.floor(savedAmount / 500))}% of your savings 
                    in SIPs or mutual funds for long-term growth!
                </p>
            </div>
        </Card>
    );
};

export default function Dashboard() {
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

    // Generate predictive alerts with investment insights
    const getPredictiveAlerts = () => {
        const alerts = [];
        const savingsRate = remainingBalance > 0 ? (remainingBalance / totalIncome) * 100 : 0;
        const weeklySpending = averageDailySpending * 7;
        const monthlyInvestmentPotential = remainingBalance > 0 ? Math.floor(remainingBalance * 0.2) : 0;
        
        // Critical financial alerts
        if (projectedOverspending > 0 && daysUntilOverspending > 0) {
            alerts.push({
                type: 'warning' as const,
                title: '🚨 Critical Budget Alert',
                message: `At your current spending rate, you'll overshoot your budget by ₹${projectedOverspending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in ${daysUntilOverspending} day${daysUntilOverspending !== 1 ? 's' : ''}. Consider reducing discretionary spending by 15-20%.`,
            });
        }
        
        if (remainingBalance < totalIncome * 0.1 && remainingBalance > 0) {
            alerts.push({
                type: 'warning' as const,
                title: '⚠️ Emergency Fund Alert',
                message: `You have only ₹${remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining. Consider pausing non-essential expenses and building an emergency fund of 3-6 months' expenses.`,
            });
        }
        
        if (remainingBalance < 0) {
            alerts.push({
                type: 'error' as const,
                title: '💳 Debt Warning',
                message: `You've exceeded your monthly budget by ₹${Math.abs(remainingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Consider using this as a learning opportunity to create a stricter budget next month.`,
            });
        }
        
        // Investment opportunity alerts
        if (savingsRate >= 20 && remainingBalance > 5000) {
            alerts.push({
                type: 'success' as const,
                title: '🚀 Investment Opportunity',
                message: `Excellent savings rate of ${savingsRate.toFixed(1)}%! Consider starting a ₹${monthlyInvestmentPotential.toLocaleString('en-IN')} monthly SIP in index funds or exploring mutual funds for long-term wealth creation.`,
            });
        }
        
        if (savingsRate >= 10 && savingsRate < 20 && remainingBalance > 2000) {
            alerts.push({
                type: 'info' as const,
                title: '💰 Smart Savings Alert',
                message: `Good savings rate of ${savingsRate.toFixed(1)}%! You could invest ₹${monthlyInvestmentPotential.toLocaleString('en-IN')} monthly in recurring deposits or start building your emergency fund.`,
            });
        }
        
        // Spending pattern alerts
        if (weeklySpending > totalIncome * 0.3 && remainingBalance > 0) {
            alerts.push({
                type: 'info' as const,
                title: '📊 Spending Pattern Alert',
                message: `Your weekly spending is ₹${weeklySpending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings & investments.`,
            });
        }
        
        // Positive reinforcement
        if (savingsRate >= 30) {
            alerts.push({
                type: 'success' as const,
                title: '🏆 Outstanding Financial Health!',
                message: `Incredible savings rate of ${savingsRate.toFixed(1)}%! You're in the top tier of savers. Consider diversifying into stocks, bonds, or real estate investment trusts (REITs).`,
            });
        } else if (savingsRate >= 20 && savingsRate < 30) {
            alerts.push({
                type: 'success' as const,
                title: '✅ Excellent Progress!',
                message: `You're doing well with ${savingsRate.toFixed(1)}% savings rate! With ₹${remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining, consider increasing your investment allocation by 5-10%.`,
            });
        }
        
        return alerts;
    };

    // Generate concise savings suggestions with investment focus
    const getSavingsSuggestions = () => {
        const suggestions = [];
        const monthlyInvestmentPotential = remainingBalance > 0 ? Math.floor(remainingBalance * 0.2) : 0;
        
        // Investment-focused suggestions
        if (monthlyInvestmentPotential >= 500) {
            suggestions.push({
                category: 'SIP Investment',
                suggestion: `Start ₹${monthlyInvestmentPotential.toLocaleString('en-IN')} monthly SIP`,
                potentialSaving: monthlyInvestmentPotential * 12 * 0.12,
                difficulty: 'Easy',
                icon: '📈',
                priority: 'High',
            });
        }
        
        suggestions.push({
            category: 'PPF Investment',
            suggestion: '₹2,000 monthly in PPF',
            potentialSaving: 24000,
            difficulty: 'Easy',
            icon: '🏦',
            priority: 'High',
        });
        
        suggestions.push({
            category: 'Gold ETF',
            suggestion: '10% savings to gold ETFs',
            potentialSaving: remainingBalance * 0.1 * 12 * 0.08,
            difficulty: 'Medium',
            icon: '🥇',
            priority: 'Medium',
        });
        
        if (averageDailySpending > 0) {
            suggestions.push({
                category: 'Meal Savings',
                suggestion: 'Skip 1 restaurant meal/week',
                potentialSaving: averageDailySpending * 7 * 4 * 0.10,
                difficulty: 'Easy',
                icon: '🍽️',
                priority: 'Medium',
            });
        }
        
        suggestions.push({
            category: 'Tax Saving',
            suggestion: 'Max 80C with ELSS funds',
            potentialSaving: 46800,
            difficulty: 'Medium',
            icon: '💰',
            priority: 'High',
        });
        
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

            {/* Income vs Expense Chart */}
            {totalIncome > 0 && (
                <Card className="mb-6">
                    <h3 className="text-lg font-semibold text-on-surface mb-4">Income vs Expense</h3>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { name: 'Income', amount: totalIncome, fill: '#10b981' },
                                    { name: 'Expenses', amount: totalSpent, fill: '#ef4444' },
                                    { name: 'Balance', amount: Math.max(0, remainingBalance), fill: '#3b82f6' }
                                ]}
                                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                                barCategoryGap="20%"
                            >
                                <CartesianGrid strokeDasharray="2 2" stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    axisLine={{ stroke: '#e5e7eb' }}
                                />
                                <YAxis 
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    axisLine={{ stroke: '#e5e7eb' }}
                                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip 
                                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                                    labelStyle={{ color: '#374151', fontSize: '12px' }}
                                    contentStyle={{ 
                                        backgroundColor: '#ffffff', 
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        fontSize: '12px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                />
                                <Bar 
                                    dataKey="amount" 
                                    radius={[2, 2, 0, 0]}
                                    maxBarSize={60}
                                >
                                    {[
                                        { fill: '#10b981' },
                                        { fill: '#ef4444' },
                                        { fill: '#3b82f6' }
                                    ].map((entry, index) => (
                                        <RechartsCell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                        <div>
                            <div className="text-xs text-on-surface-variant">Income</div>
                            <div className="text-base font-semibold text-tertiary">{formatCurrency(totalIncome)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-on-surface-variant">Expenses</div>
                            <div className="text-base font-semibold text-error">{formatCurrency(totalSpent)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-on-surface-variant">Balance</div>
                            <div className={`text-base font-semibold ${remainingBalance >= 0 ? 'text-primary' : 'text-error'}`}>
                                {formatCurrency(remainingBalance)}
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 text-center">
                        <div className="text-xs text-on-surface-variant mb-1">
                            Spending Rate: {((totalSpent / totalIncome) * 100).toFixed(1)}%
                        </div>
                        <div className="w-full bg-surface-variant/50 rounded-full h-1.5">
                            <div 
                                className={`h-1.5 rounded-full ${(totalSpent / totalIncome) > 0.8 ? 'bg-error' : (totalSpent / totalIncome) > 0.6 ? 'bg-warning' : 'bg-tertiary'}`}
                                style={{ width: `${Math.min(100, (totalSpent / totalIncome) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </Card>
            )}

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
}