import React, { useEffect, useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAppState } from '../../context/AppContext';
import { HealthyProductLaunch, GroceryItem } from '../../types';
import { supabase } from '../../lib/supabase';
import { groceryListsService } from '../../services/supabaseService';
import { getNewHealthyProductLaunches } from '../../services/healthyLaunchesService';

export default function HealthyProductLaunches() {
    const { userProfile } = useAppState();
    const [wishlist, setWishlist] = useState<HealthyProductLaunch[]>(() => {
        try {
            const raw = localStorage.getItem('healthyWishlist');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const [filterBudget, setFilterBudget] = useState<string>('');
    const [filterPref, setFilterPref] = useState<string>('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const launches: HealthyProductLaunch[] = useMemo(() => {
        const budgetNum = Number(filterBudget);
        return getNewHealthyProductLaunches({
            maxPriceINR: Number.isFinite(budgetNum) && budgetNum > 0 ? budgetNum : undefined,
            preferenceQuery: filterPref || undefined,
        });
    }, [filterBudget, filterPref]);

    useEffect(() => {
        try {
            localStorage.setItem('healthyWishlist', JSON.stringify(wishlist));
        } catch {}
    }, [wishlist]);

    useEffect(() => {
        // Set up auto-refresh every 30 minutes
        const interval = setInterval(() => {
            setLastUpdated(new Date());
        }, 30 * 60 * 1000); // 30 minutes

        return () => clearInterval(interval);
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLastUpdated(new Date());
        setIsRefreshing(false);
    };

    const addToGroceryPlan = async (product: HealthyProductLaunch) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { 
                alert('Please sign in to add to your grocery plan.'); 
                return; 
            }
            const lists = await groceryListsService.getGroceryLists(user.id);
            const target = lists.find(l => l.name === 'Healthy Launches Picks');
            const newItem: GroceryItem = { 
                item: product.name, 
                quantity: '1 unit', 
                category: product.category 
            };
            const items = target ? [...target.items, newItem] : [newItem];
            await groceryListsService.saveGroceryList(
                user.id, 
                items, 
                'Healthy Launches Picks', 
                target?.id
            );
            alert('Added to your grocery plan list: Healthy Launches Picks');
        } catch (err: any) {
            console.error('Add to plan error:', err);
            alert(err.message || 'Failed to add to grocery plan');
        }
    };

    const addToWishlist = (product: HealthyProductLaunch) => {
        setWishlist(prev => {
            const exists = prev.find(w => w.id === product.id);
            if (exists) {
                alert('Product already in wishlist');
                return prev;
            }
            alert('Added to wishlist');
            return [...prev, product];
        });
    };

    const removeFromWishlist = (productId: string) => {
        setWishlist(prev => prev.filter(w => w.id !== productId));
        alert('Removed from wishlist');
    };

    const formatDate = (date: Date) => {
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
            {/* Controls and Filters */}
            <Card className="mb-6">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-on-surface-variant">
                            Last updated: {formatDate(lastUpdated)}
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? '🔄' : '↻'} Refresh
                        </Button>
                    </div>
                    <div className="flex gap-2 text-xs sm:text-sm">
                        <span className="px-2 py-1 bg-success-container text-success rounded-full">
                            {launches.length} Products
                        </span>
                        <span className="px-2 py-1 bg-primary-container text-primary rounded-full">
                            {wishlist.length} in Wishlist
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <input
                        type="number"
                        placeholder="Max budget (₹)"
                        value={filterBudget}
                        onChange={(e) => setFilterBudget(e.target.value)}
                        className="bg-surface-variant/50 p-2 rounded-lg border border-outline/30 text-on-surface w-32 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                        type="text"
                        placeholder="Preference (e.g., low fat, millet)"
                        value={filterPref}
                        onChange={(e) => setFilterPref(e.target.value)}
                        className="bg-surface-variant/50 p-2 rounded-lg border border-outline/30 text-on-surface w-56 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setFilterBudget('');
                            setFilterPref('');
                        }}
                    >
                        Clear Filters
                    </Button>
                </div>
            </Card>

            {/* Wishlist Section */}
            {wishlist.length > 0 && (
                <Card className="mb-6 bg-primary-container/30">
                    <h3 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
                        <span>❤️</span>
                        Your Wishlist ({wishlist.length} items)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {wishlist.map((product) => (
                            <div key={product.id} className="bg-surface/80 rounded-lg p-3 border border-outline/20">
                                <h4 className="font-medium text-sm">{product.name}</h4>
                                <p className="text-xs text-gray-600">{product.category}</p>
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        size="xs"
                                        onClick={() => addToGroceryPlan(product)}
                                        disabled={!userProfile}
                                    >
                                        Add to Plan
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={() => removeFromWishlist(product.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Product Grid */}
            {launches.length === 0 ? (
                <Card>
                    <div className="text-center py-8">
                        <p className="text-on-surface-variant mb-2">No products match your current filters.</p>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setFilterBudget('');
                                setFilterPref('');
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {launches.map((product) => {
                        const isInWishlist = wishlist.some(w => w.id === product.id);
                        return (
                            <Card key={product.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="px-2 py-1 bg-secondary-container text-secondary text-xs rounded-full">
                                            {product.category}
                                        </span>
                                        <span className="text-xs text-on-surface-variant">
                                            {new Date(product.launchDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    
                                    <h4 className="font-semibold text-lg mb-2">{product.name}</h4>
                                    <p className="text-sm text-gray-600 mb-3">{product.healthBenefit}</p>
                                    
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-medium text-primary">
                                            Approx. ₹{product.priceINR}
                                        </span>
                                        {product.sourceUrl && (
                                            <a
                                                href={product.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline"
                                            >
                                                View Source →
                                            </a>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        onClick={() => addToGroceryPlan(product)}
                                        disabled={!userProfile}
                                        className="flex-1"
                                    >
                                        Add to Plan
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={isInWishlist ? "solid" : "outline"}
                                        onClick={() => isInWishlist ? removeFromWishlist(product.id) : addToWishlist(product)}
                                        className={isInWishlist ? "bg-red-500 text-white" : ""}
                                    >
                                        {isInWishlist ? '❤️' : '🤍'}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}