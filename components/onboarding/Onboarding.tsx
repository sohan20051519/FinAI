
import React, { useState } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { FixedExpense, UserProfile } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { XCircleIcon } from '../icons/Icons';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', age: 18, familyMembers: 1 });
  const [monthlyIncome, setMonthlyIncome] = useState<number>(50000);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [currentExpense, setCurrentExpense] = useState({ name: '', amount: '' });

  const dispatch = useAppDispatch();

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserProfile({ ...userProfile, [e.target.name]: e.target.value });
  };

  const handleAddFixedExpense = () => {
    if (currentExpense.name && currentExpense.amount) {
      setFixedExpenses([...fixedExpenses, { id: new Date().toISOString(), name: currentExpense.name, amount: parseFloat(currentExpense.amount) }]);
      setCurrentExpense({ name: '', amount: '' });
    }
  };
  
  const handleRemoveFixedExpense = (id: string) => {
    setFixedExpenses(fixedExpenses.filter(exp => exp.id !== id));
  };
  
  const handleFinish = () => {
    dispatch({
      type: 'INITIALIZE_APP',
      payload: { userProfile, monthlyIncome, fixedExpenses }
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-medium text-on-surface mb-2">Welcome to FinAI!</h2>
            <p className="text-on-surface-variant mb-6">Let's get to know you a little.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-on-surface-variant mb-1">What's your name?</label>
                <input id="name" name="name" type="text" value={userProfile.name} onChange={handleProfileChange} className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface placeholder:text-on-surface-variant" placeholder="e.g., Alex Doe" required />
              </div>
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-on-surface-variant mb-1">How old are you?</label>
                <input id="age" name="age" type="number" value={userProfile.age} onChange={handleProfileChange} className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface" required min="1" />
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="mt-6 w-full" disabled={!userProfile.name}>Next</Button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-medium text-on-surface mb-2">Financial Details</h2>
            <p className="text-on-surface-variant mb-6">This will help us create your budget.</p>
            <div className="space-y-4">
                <div>
                    <label htmlFor="monthlyIncome" className="block text-sm font-medium text-on-surface-variant mb-1">What's your total fixed monthly income? (₹)</label>
                    <input id="monthlyIncome" type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(parseFloat(e.target.value))} className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface placeholder:text-on-surface-variant" required />
                </div>
                <div>
                    <label htmlFor="familyMembers" className="block text-sm font-medium text-on-surface-variant mb-1">How many family members are in your household?</label>
                    <input id="familyMembers" name="familyMembers" type="number" value={userProfile.familyMembers} onChange={handleProfileChange} className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface placeholder:text-on-surface-variant" required min="1" />
                </div>
            </div>
            <div className="flex gap-4 mt-6">
                <Button onClick={() => setStep(1)} className="w-full !bg-secondary-container !text-on-secondary-container">Back</Button>
                <Button onClick={() => setStep(3)} className="w-full">Next</Button>
            </div>
          </div>
        );
      case 3:
        return (
            <div>
              <h2 className="text-2xl font-medium text-on-surface mb-2">Fixed Monthly Expenses</h2>
              <p className="text-on-surface-variant mb-6">Add recurring costs like rent, EMIs, or subscriptions.</p>
              <div className="space-y-2 mb-4">
                  {fixedExpenses.map(exp => (
                      <div key={exp.id} className="flex items-center justify-between bg-surface-variant/50 p-2 rounded-lg text-on-surface">
                          <span className="font-medium">{exp.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <button onClick={() => handleRemoveFixedExpense(exp.id)} className="text-on-surface-variant hover:text-error">
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                          </div>
                      </div>
                  ))}
              </div>
              <div className="flex gap-2 items-end">
                  <div className="flex-1">
                      <label className="text-sm text-on-surface-variant">Expense Name</label>
                      <input type="text" placeholder="e.g., Rent" value={currentExpense.name} onChange={e => setCurrentExpense({...currentExpense, name: e.target.value})} className="w-full bg-surface-variant/50 p-2 rounded-lg border border-outline/30 text-on-surface placeholder:text-on-surface-variant"/>
                  </div>
                  <div className="w-28">
                      <label className="text-sm text-on-surface-variant">Amount (₹)</label>
                      <input type="number" placeholder="15000" value={currentExpense.amount} onChange={e => setCurrentExpense({...currentExpense, amount: e.target.value})} className="w-full bg-surface-variant/50 p-2 rounded-lg border border-outline/30 text-on-surface placeholder:text-on-surface-variant"/>
                  </div>
                  <Button onClick={handleAddFixedExpense} className="!px-4 !py-2">Add</Button>
              </div>
              <div className="flex gap-4 mt-6">
                  <Button onClick={() => setStep(2)} className="w-full !bg-secondary-container !text-on-secondary-container">Back</Button>
                  <Button onClick={handleFinish} className="w-full">Get Started!</Button>
              </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
            {renderStep()}
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;