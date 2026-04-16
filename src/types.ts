export interface Product {
  id: string;
  title: string;
  category: 'Skin Care' | 'Hair Care' | 'Body Care' | 'Bags' | 'Cosmetics' | 'Watches';
  price: number;
  discountPercentage?: number;
  productCode?: string;
  imageUrl: string;
  createdAt: any; // Firestore Timestamp
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  createdAt: any;
}
