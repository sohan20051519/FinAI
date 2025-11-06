import { supabase } from '../lib/supabase';

export interface HealthyProduct {
  id: string;
  common_product: string;
  healthy_alternative: string;
  category: string;
  health_benefits: string;
  nutritional_info: string | null;
  availability: string;
  price_range: string | null;
  brand_suggestions: string[] | null;
  region_specific: string | null;
}

export interface HealthyProductSuggestion {
  common_product: string;
  healthy_alternative: string;
  category: string;
  health_benefits: string;
  nutritional_info: string | null;
  availability: string;
  price_range: string | null;
  brand_suggestions: string[] | null;
}

// Get healthy alternatives for a product
export async function getHealthyAlternatives(searchProduct: string): Promise<HealthyProductSuggestion[]> {
  try {
    const { data, error } = await supabase.rpc('get_healthy_alternatives', {
      search_product: searchProduct
    });

    if (error) {
      console.error('Error fetching healthy alternatives:', error);
      throw error;
    }

    return data || [];
  } catch (err: any) {
    console.error('Error in getHealthyAlternatives:', err);
    // Fallback: search directly in the table
    const { data, error } = await supabase
      .from('healthy_products')
      .select('common_product, healthy_alternative, category, health_benefits, nutritional_info, availability, price_range, brand_suggestions')
      .or(`common_product.ilike.%${searchProduct}%,healthy_alternative.ilike.%${searchProduct}%,category.ilike.%${searchProduct}%`)
      .limit(10);

    if (error) {
      console.error('Error in fallback search:', error);
      return [];
    }

    return data || [];
  }
}

// Get all products by category
export async function getProductsByCategory(category: string): Promise<HealthyProductSuggestion[]> {
  try {
    const { data, error } = await supabase
      .from('healthy_products')
      .select('common_product, healthy_alternative, category, health_benefits, nutritional_info, availability, price_range, brand_suggestions')
      .eq('category', category)
      .order('common_product');

    if (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }

    return data || [];
  } catch (err: any) {
    console.error('Error in getProductsByCategory:', err);
    return [];
  }
}

// Get all categories
export async function getCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('healthy_products')
      .select('category')
      .order('category');

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    const uniqueCategories = [...new Set((data || []).map(item => item.category))];
    return uniqueCategories;
  } catch (err: any) {
    console.error('Error in getCategories:', err);
    return [];
  }
}

// Get random healthy product suggestions
export async function getRandomSuggestions(limit: number = 5): Promise<HealthyProductSuggestion[]> {
  try {
    const { data, error } = await supabase
      .from('healthy_products')
      .select('common_product, healthy_alternative, category, health_benefits, nutritional_info, availability, price_range, brand_suggestions')
      .limit(limit);

    if (error) {
      console.error('Error fetching random suggestions:', error);
      throw error;
    }

    // Shuffle the results
    const shuffled = (data || []).sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  } catch (err: any) {
    console.error('Error in getRandomSuggestions:', err);
    return [];
  }
}

