export interface ProductPrice {
  productName: string;
  store: string;
  price: number;
  url: string;
}

export const mockProductPrices: ProductPrice[] = [
  {
    productName: 'Organic Brown Rice',
    store: 'Amazon',
    price: 4.99,
    url: 'https://www.amazon.com/s?k=organic+brown+rice',
  },
  {
    productName: 'Organic Brown Rice',
    store: 'Walmart',
    price: 4.79,
    url: 'https://www.walmart.com/search?q=organic+brown+rice',
  },
  {
    productName: 'Organic Brown Rice',
    store: 'Thrive Market',
    price: 5.29,
    url: 'https://thrivemarket.com/products/organic-brown-rice',
  },
  {
    productName: 'Himalayan Pink Salt',
    store: 'Amazon',
    price: 3.49,
    url: 'https://www.amazon.com/s?k=himalayan+pink+salt',
  },
  {
    productName: 'Himalayan Pink Salt',
    store: 'Walmart',
    price: 3.29,
    url: 'https://www.walmart.com/search?q=himalayan+pink+salt',
  },
  {
    productName: 'Himalayan Pink Salt',
    store: 'Thrive Market',
    price: 3.99,
    url: 'https://thrivemarket.com/products/himalayan-pink-salt',
  },
  {
    productName: 'Organic Coconut Oil',
    store: 'Amazon',
    price: 8.99,
    url: 'https://www.amazon.com/s?k=organic+coconut+oil',
  },
  {
    productName: 'Organic Coconut Oil',
    store: 'Walmart',
    price: 8.49,
    url: 'https://www.walmart.com/search?q=organic+coconut+oil',
  },
  {
    productName: 'Organic Coconut Oil',
    store: 'Thrive Market',
    price: 9.49,
    url: 'https://thrivemarket.com/products/organic-coconut-oil',
  },
];

export const getMockProductPrices = (productName: string): ProductPrice[] => {
  if (!productName) {
    return [];
  }
  return mockProductPrices.filter(
    (p) => p.productName.toLowerCase() === productName.toLowerCase()
  );
};
