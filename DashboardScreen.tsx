
import React, { useMemo } from 'react';
import { useAppState, useLocalization } from '../../contexts/DataProvider';
import { OrderStatus } from '../../types';
import { Card, Badge } from '../ui';
import { Link } from 'react-router-dom';
import { STATUS_COLORS } from '../../constants';

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}
const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon }) => (
    <Card className="p-6 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
        <div className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 rounded-full p-3">
            {icon}
        </div>
    </Card>
);

const DocumentTextIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);

const CurrencyRupeeIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 8.52H9.5a3.5 3.5 0 0 0 0 7h8"/><path d="M8 15h10"/><path d="M9 11.5h10"/></svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);


export const DashboardScreen: React.FC = () => {
    const { orders, customers } = useAppState();
    const { t } = useLocalization();

    const kpis = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const todayStr = now.toISOString().split('T')[0];

        const activeOrders = orders.filter(o => ![OrderStatus.Completed, OrderStatus.Delivered, OrderStatus.Cancelled].includes(o.status)).length;
        const dueToday = orders.filter(o => o.dueDate.startsWith(todayStr) && o.status !== OrderStatus.Delivered).length;

        const revenueThisMonth = orders
            .filter(o => new Date(o.orderDate) >= startOfMonth)
            .flatMap(o => o.payments)
            .reduce((sum, payment) => sum + payment.amount, 0);

        const completedThisMonth = orders.filter(o => 
            (o.status === OrderStatus.Completed || o.status === OrderStatus.Delivered) &&
            new Date(o.orderDate) >= startOfMonth
        ).length;

        return { activeOrders, dueToday, revenueThisMonth, completedThisMonth };
    }, [orders]);
    
    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });

    const getCustomerName = (customerId: string) => {
        return customers.find(c => c.id === customerId)?.fullName || 'Unknown';
    };
    
    const recentOrders = useMemo(() => {
        return [...orders].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).slice(0, 5);
    }, [orders]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('dashboard.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title={t('kpi.activeOrders')} value={kpis.activeOrders} icon={<DocumentTextIcon />} />
                <KpiCard title={t('kpi.dueToday')} value={kpis.dueToday} icon={<CalendarIcon />} />
                <KpiCard title={t('kpi.revenueMonth')} value={currencyFormatter.format(kpis.revenueThisMonth)} icon={<CurrencyRupeeIcon />} />
                <KpiCard title={t('kpi.completedMonth')} value={kpis.completedThisMonth} icon={<CheckCircleIcon />} />
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Recent Orders</h3>
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('order.order')} #</th>
                                    <th scope="col" className="px-6 py-3">{t('order.customer')}</th>
                                    <th scope="col" className="px-6 py-3">{t('order.dueDate')}</th>
                                    <th scope="col" className="px-6 py-3">{t('order.balance')}</th>
                                    <th scope="col" className="px-6 py-3">{t('order.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(order => {
                                    const isNew = (new Date().getTime() - new Date(order.orderDate).getTime()) < 24 * 60 * 60 * 1000;
                                    return (
                                        <tr key={order.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                                <Link to={`/orders/${order.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{order.orderNumber}</Link>
                                                {isNew && <Badge className={`ml-2 ${STATUS_COLORS[OrderStatus.New]}`}>New</Badge>}
                                            </td>
                                            <td className="px-6 py-4">{getCustomerName(order.customerId)}</td>
                                            <td className="px-6 py-4">{new Date(order.dueDate).toLocaleDateString('en-IN')}</td>
                                            <td className="px-6 py-4">{currencyFormatter.format(order.balance)}</td>
                                            <td className="px-6 py-4">
                                                <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};
