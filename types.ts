
export type Language = 'en' | 'hi' | 'mr';
export type Theme = 'light' | 'dark';

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface EmployeePayment {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  createdAt: string;
  payments: EmployeePayment[];
  phone?: string;
}

export type GarmentType = string;

export interface GarmentTypeDefinition {
  name: GarmentType;
  measurementFields: string[];
}

export interface Measurement {
  id: string;
  customerId: string;
  garmentType: GarmentType;
  measurements: Record<string, number>;
  createdAt: string;
}

export enum OrderStatus {
  New = 'New',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

export interface WorkAssignment {
  id: string;
  employeeId?: string;
  workPhoto?: string;
  payment: number;
}

export interface LineItem {
  id: string;
  garmentType: GarmentType;
  quantity: number;
  unitPrice: number;
  fabricSource: 'Customer' | 'Shop';
  notes?: string;
  measurementSnapshot: Record<string, number>;
  photo?: string;
  assignments: WorkAssignment[];
}

export interface Payment {
  id: string;
  amount: number;
  method: 'Cash' | 'UPI' | 'Card';
  date: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: string;
  dueDate: string;
  status: OrderStatus;
  items: LineItem[];
  subtotal: number;
  discount: number;
  total: number;
  advance: number;
  payments: Payment[];
  balance: number;
  notes?: string;
}

export interface ShopInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
}

export type AppState = {
  language: Language;
  theme: Theme;
  customers: Customer[];
  measurements: Measurement[];
  orders: Order[];
  garmentTypes: GarmentTypeDefinition[];
  employees: Employee[];
  isAuthenticated: boolean;
  shopInfo: ShopInfo;
};

export type Action =
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'ADD_MEASUREMENT'; payload: Measurement }
  | { type: 'UPDATE_MEASUREMENT'; payload: Measurement }
  | { type: 'ADD_GARMENT_TYPE'; payload: GarmentTypeDefinition }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_SHOP_INFO'; payload: ShopInfo }
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  // Fix: Update payload to include employees for backup/restore functionality. This fixes the error in DataProvider.tsx.
  | { type: 'RESTORE_STATE'; payload: Omit<AppState, 'language' | 'theme' | 'isAuthenticated'> };