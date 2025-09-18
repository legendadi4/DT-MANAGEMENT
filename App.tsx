
import React, { useState } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { DataProvider, useLocalization, useAppState } from './contexts/DataProvider';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { OrdersScreen } from './components/screens/OrdersScreen';
import { CustomersScreen } from './components/screens/CustomersScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { OrderDetailScreen } from './components/screens/OrderDetailScreen';
import { NewOrderScreen } from './components/screens/NewOrderScreen';
import { EmployeesScreen } from './components/screens/EmployeesScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { EmployeeDetailScreen } from './components/screens/EmployeeDetailScreen';
import { CustomerDetailScreen } from './components/screens/CustomerDetailScreen';

const TailorLogoIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
);

const HamburgerIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const Header: React.FC = () => {
    const { t } = useLocalization();
    const { shopInfo } = useAppState();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
    const activeLinkClasses = "bg-indigo-700 text-white";
    const inactiveLinkClasses = "text-indigo-100 hover:bg-indigo-500 hover:bg-opacity-75";

    const mobileNavLinkClasses = "block px-3 py-2 rounded-md text-base font-medium";
    const mobileActiveLinkClasses = "bg-indigo-700 text-white";
    const mobileInactiveLinkClasses = "text-indigo-100 hover:bg-indigo-500 hover:bg-opacity-75";

    const handleLinkClick = () => {
      setIsMobileMenuOpen(false);
    }

    return (
        <header className="bg-indigo-600 dark:bg-slate-800 text-white shadow-md no-print">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <TailorLogoIcon className="w-8 h-8 text-indigo-300" />
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">{shopInfo.name}</h1>
                                <p className="text-xs text-indigo-200 dark:text-slate-400 font-light opacity-90">{shopInfo.tagline}</p>
                            </div>
                        </div>
                    </div>
                    <nav className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <NavLink to="/" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('nav.dashboard')}</NavLink>
                            <NavLink to="/orders" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('nav.orders')}</NavLink>
                            <NavLink to="/customers" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('nav.customers')}</NavLink>
                            <NavLink to="/employees" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('nav.employees')}</NavLink>
                            <NavLink to="/settings" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('nav.settings')}</NavLink>
                        </div>
                    </nav>
                     <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-500 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
                            aria-controls="mobile-menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMobileMenuOpen ? <XIcon /> : <HamburgerIcon />}
                        </button>
                    </div>
                </div>
            </div>
            {isMobileMenuOpen && (
                <div className="md:hidden" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NavLink to="/" onClick={handleLinkClick} className={({isActive}) => `${mobileNavLinkClasses} ${isActive ? mobileActiveLinkClasses : mobileInactiveLinkClasses}`}>{t('nav.dashboard')}</NavLink>
                        <NavLink to="/orders" onClick={handleLinkClick} className={({isActive}) => `${mobileNavLinkClasses} ${isActive ? mobileActiveLinkClasses : mobileInactiveLinkClasses}`}>{t('nav.orders')}</NavLink>
                        <NavLink to="/customers" onClick={handleLinkClick} className={({isActive}) => `${mobileNavLinkClasses} ${isActive ? mobileActiveLinkClasses : mobileInactiveLinkClasses}`}>{t('nav.customers')}</NavLink>
                        <NavLink to="/employees" onClick={handleLinkClick} className={({isActive}) => `${mobileNavLinkClasses} ${isActive ? mobileActiveLinkClasses : mobileInactiveLinkClasses}`}>{t('nav.employees')}</NavLink>
                        <NavLink to="/settings" onClick={handleLinkClick} className={({isActive}) => `${mobileNavLinkClasses} ${isActive ? mobileActiveLinkClasses : mobileInactiveLinkClasses}`}>{t('nav.settings')}</NavLink>
                    </div>
                </div>
            )}
        </header>
    );
};

const Footer: React.FC = () => (
    <footer className="text-center py-4 mt-8 no-print">
        <p className="text-xs text-slate-500 dark:text-slate-400">
            Proudly Made in India 🇮🇳
        </p>
    </footer>
);


const AppContent: React.FC = () => {
  return (
    <HashRouter>
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Routes>
                        <Route path="/" element={<DashboardScreen />} />
                        <Route path="/orders" element={<OrdersScreen />} />
                        <Route path="/orders/new" element={<NewOrderScreen />} />
                        <Route path="/orders/:orderId" element={<OrderDetailScreen />} />
                        <Route path="/orders/:orderId/edit" element={<NewOrderScreen />} />
                        <Route path="/customers" element={<CustomersScreen />} />
                        <Route path="/customers/:customerId" element={<CustomerDetailScreen />} />
                        <Route path="/employees" element={<EmployeesScreen />} />
                        <Route path="/employees/:employeeId" element={<EmployeeDetailScreen />} />
                        <Route path="/settings" element={<SettingsScreen />} />
                    </Routes>
                </div>
            </main>
            <Footer />
        </div>
    </HashRouter>
  );
}

const AppRouter: React.FC = () => {
    const { isAuthenticated } = useAppState();

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    return <AppContent />;
}

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppRouter />
    </DataProvider>
  );
};

export default App;
