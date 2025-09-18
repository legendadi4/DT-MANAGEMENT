
import React, { createContext, useReducer, useContext, useEffect, ReactNode } from 'react';
import type { AppState, Action, Language, Theme, GarmentTypeDefinition, Measurement, Order, Employee } from '../types';
import { LOCALES, MOCK_INITIAL_STATE } from '../constants';

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'UPDATE_ORDER':
        return { ...state, orders: state.orders.map(o => o.id === action.payload.id ? action.payload : o) };
    case 'ADD_MEASUREMENT':
      return { ...state, measurements: [...state.measurements, action.payload] };
    case 'UPDATE_MEASUREMENT':
      return { ...state, measurements: state.measurements.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'ADD_GARMENT_TYPE':
        // Avoid duplicates
        if (state.garmentTypes.some(gt => gt.name.toLowerCase() === action.payload.name.toLowerCase())) {
            return state;
        }
        return { ...state, garmentTypes: [...state.garmentTypes, action.payload] };
    case 'ADD_EMPLOYEE':
        return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
        return { ...state, employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'UPDATE_SHOP_INFO':
        return { ...state, shopInfo: action.payload };
    case 'LOGIN':
        return { ...state, isAuthenticated: true };
    case 'LOGOUT':
        return { ...state, isAuthenticated: false };
    case 'RESTORE_STATE':
        return {
            ...state, // keep language, theme, and auth state
            ...action.payload, // overwrite all data
            employees: action.payload.employees || [],
        };
    default:
      return state;
  }
};

const getInitialState = (): AppState => {
    try {
        const item = window.localStorage.getItem('deepakTailorState');
        const storedState = item ? JSON.parse(item) : MOCK_INITIAL_STATE;

        // --- MIGRATION LOGIC ---
        if (storedState) {
             // Migrate orders for per-unit assignment and payment field
            if (storedState.orders) {
                storedState.orders.forEach((order: Order) => {
                    order.items.forEach((item: any) => { // Use any for migration
                        if (!item.assignments) {
                           item.assignments = [];
                            for (let i = 0; i < (item.quantity || 1); i++) {
                                item.assignments.push({ id: `${item.id}-A${i + 1}`, payment: 0 });
                            }
                        } else {
                            // Ensure payment field exists on existing assignments
                            item.assignments.forEach((assignment: any) => {
                                if (assignment.payment === undefined) {
                                    assignment.payment = 0;
                                }
                            });
                        }
                        delete item.employeeId;
                        delete item.workPhoto;
                    });
                });
            }

            // Migrate employees to add payments array and phone
            if (storedState.employees) {
                storedState.employees.forEach((employee: Employee) => {
                    if (!employee.payments) {
                        employee.payments = [];
                    }
                    if (employee.phone === undefined) {
                        employee.phone = '';
                    }
                });
            }
        }
        // --- END MIGRATION LOGIC ---


        const isAuthenticated = window.localStorage.getItem('deepakTailorAuth') === 'true';

        // Ensure all state keys are present, falling back to mock if not
        return {
            ...MOCK_INITIAL_STATE,
            ...storedState,
            isAuthenticated,
        };
    } catch (error) {
        console.warn('Error reading from localStorage', error);
        return { ...MOCK_INITIAL_STATE, isAuthenticated: false };
    }
}

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  useEffect(() => {
    try {
        const stateToStore = { ...state };
        // Don't persist theme or auth state in this object, they have their own storage
        delete (stateToStore as Partial<AppState>).theme;
        delete (stateToStore as Partial<AppState>).isAuthenticated;
        window.localStorage.setItem('deepakTailorState', JSON.stringify(stateToStore));
    } catch (error) {
        console.warn('Error writing to localStorage', error);
    }
  }, [state]);

  useEffect(() => {
    if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
        window.localStorage.setItem('deepakTailorTheme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        window.localStorage.setItem('deepakTailorTheme', 'light');
    }
  }, [state.theme]);


  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within a DataProvider');
  }
  return context;
};

export const useAppDispatch = (): React.Dispatch<Action> => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within a DataProvider');
  }
  return context;
};

export const useLocalization = () => {
  const { language, theme } = useAppState();
  const dispatch = useAppDispatch();

  const t = (key: string): string => {
    return LOCALES[language]?.[key] || key;
  };
  
  const setLanguage = (lang: Language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  };

  const setTheme = (theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  return { t, language, setLanguage, theme, setTheme };
};