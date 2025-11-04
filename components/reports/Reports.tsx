
import React, { useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';

const Header: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <header className="mb-8">
        <h1 className="text-4xl font-normal text-on-surface">{title}</h1>
        <p className="text-base text-on-surface-variant">{subtitle}</p>
    </header>
);

const COLORS = ['#6750A4', '#7D5260', '#625B71', '#B3261E', '#EADDFF', '#FFD8E4', '#E8DEF8', '#F9DEDC'];

const Reports: React.FC = () => {
    const { expenses } = useAppState();

    const dataByCategory = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const categoryMap = new Map<string, number>();
        expenses.forEach(exp => {
            const expDate = new Date(exp.date);
            const isRecurring = exp.recurring === 'monthly';
            const isOneTimeThisMonth = !isRecurring && expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
    
            if (isRecurring || isOneTimeThisMonth) {
                const currentTotal = categoryMap.get(exp.category) || 0;
                categoryMap.set(exp.category, currentTotal + exp.amount);
            }
        });
        return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    }, [expenses]);

    return (
        <div className="max-w-4xl mx-auto">
            <Header title="Spending Reports" subtitle="Visualize your financial habits for the current month." />

            <Card>
                <h2 className="text-xl font-medium text-on-surface-variant mb-4">This Month's Spending by Category</h2>
                {dataByCategory.length > 0 ? (
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={dataByCategory}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {dataByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="text-center text-on-surface-variant py-8">No expense data available to generate a report for this month.</p>
                )}
            </Card>
        </div>
    );
};

export default Reports;