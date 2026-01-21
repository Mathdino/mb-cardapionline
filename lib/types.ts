// Company/Restaurant Types
export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string;
  profileImage: string;
  bannerImage: string;
  phone: string[];
  whatsapp: string;
  minimumOrder: number;
  address: Address;
  businessHours: BusinessHours[];
  paymentMethods: PaymentMethod[];
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface BusinessHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export type PaymentMethod =
  | "cash"
  | "credit"
  | "debit"
  | "pix"
  | "meal_voucher";

// Category Types
export interface Category {
  id: string;
  companyId: string;
  name: string;
  order: number;
  isExpanded?: boolean;
}

// Product Types
export interface Product {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
  price: number;
  promotionalPrice?: number;
  isPromotion: boolean;
  productType: "simple" | "flavors" | "combo";
  flavors?:
    | ProductFlavor[]
    | { min: number; max: number; options: ProductFlavor[] };
  comboConfig?: ComboConfig;
  ingredients?: string[];
  isAvailable: boolean;
}

export interface ProductFlavor {
  id: string;
  name: string;
  description?: string;
  priceModifier: number; // Can be positive or negative
}

export interface ComboConfig {
  maxItems: number;
  options: ComboItem[];
  groups?: ComboGroup[];
}

export interface ComboGroup {
  id: string;
  title: string;
  type: "products" | "custom";
  min: number;
  max: number;
  productIds?: string[];
  options?: ComboItem[];
}

export interface ComboItem {
  id: string;
  name: string;
  priceModifier: number;
}

// Order Types
export interface Order {
  id: string;
  companyId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedFlavor?: string; // Kept for backward compatibility
  selectedFlavors?: string[]; // New field for multiple flavors
  comboItems?: string[];
  removedIngredients?: string[];
  subtotal: number;
}

export type OrderStatus = "pending" | "preparing" | "delivered" | "cancelled";

// Cart Types
export interface SelectedComboItem extends ComboItem {
  quantity: number;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedFlavor?: ProductFlavor; // Kept for backward compatibility
  selectedFlavors?: ProductFlavor[]; // New field for multiple flavors
  selectedComboItems?: SelectedComboItem[];
  removedIngredients?: string[];
  subtotal: number;
}

export interface Cart {
  companyId: string;
  items: CartItem[];
  total: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  role: "admin" | "company";
  companyId?: string;
  createdAt: Date;
}

// Promotion Types
export interface Promotion {
  id: string;
  companyId: string;
  productId: string;
  originalPrice: number;
  promotionalPrice: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

// Financial Types
export interface FinancialSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }[];
}
