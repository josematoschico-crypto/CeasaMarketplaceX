export interface User {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'driver';
  avatar?: string;
}

export interface Product {
  id: string;
  grupo_base: string;
  nome_exibicao: string;
  subclassificacao: string;
  categoria: string;
  unidade_medida: string;
  image: string;
}

export interface Stall {
  id: string;
  name: string;
  ownerId: string;
  location: string; // e.g., "Pavilhão A, Box 12"
  rating: number;
  image: string;
  isNew?: boolean;
  isActive?: boolean;
}

export interface StallProduct {
  id: string;
  stallId: string;
  productId: string;
  price: number;
  stock: number;
  updatedAt: string;
  product?: Product;
  yesterdayPrice?: number;
  marketAverage?: number;
  photoDate?: string;
}

export interface CartItem extends StallProduct {
  product: Product;
  stall: Stall;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  driver?: {
    name: string;
    truck: string;
    photo: string;
    phone: string;
  };
  items: {
    name: string;
    stall: string;
    quantity: string;
    price: number;
    subclassification: string;
  }[];
}
