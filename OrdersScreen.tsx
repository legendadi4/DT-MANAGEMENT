
import React, { useState, useMemo } from 'react';
import { useAppState, useLocalization } from '../../contexts/DataProvider';
import type { Order } from '../../types';
import { OrderStatus } from '../../types';
import { Card, Badge } from '../ui';
import { STATUS_COLORS } from '../../constants';
import { Link } from 'react-router-dom';

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
    const { customers } = useAppState();
    const customer = customers.find(c => c.id === order.customerId);
    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
    const isNew = (new Date().getTime() - new Date(order.orderDate).getTime()) < 24 * 60 * 60 * 1000;

    return (
        <Card className="p-4 hover:shadow-lg transition-shadow">
            <Link to={`/orders/${order.id}`} className="block">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            {order.orderNumber}
                            {isNew && <Badge className={STATUS_COLORS[OrderStatus.New]}>New</Badge>}
                        </p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{customer?.fullName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{customer?.phone}</p>
                    </div>
                    <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
                </div>
                <div className="mt-4 flex justify-between items-end text-sm">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400">Due: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(order.dueDate).toLocaleDateString('en-IN')}</span></p>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400">Balance</p>
                        <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">{currencyFormatter.format(order.balance)}</p>
                    </div>
                </div>
            </Link>
        </Card>
    );
};

export const OrdersScreen: React.FC = () => {
    const { orders } = useAppState();
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<OrderStatus | 'All'>(OrderStatus.InProgress);

    const tabs: (OrderStatus | 'All')[] = [OrderStatus.InProgress, OrderStatus.Completed, OrderStatus.Delivered, OrderStatus.Cancelled, 'All'];

    const filteredOrders = useMemo(() => {
        const sortedOrders = [...orders].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        if (activeTab === 'All') return sortedOrders;
        return sortedOrders.filter(order => order.status === activeTab);
    }, [orders, activeTab]);

    const getTabName = (tab: OrderStatus | 'All') => {
        switch(tab) {
            case OrderStatus.InProgress: return t('orders.inProgress');
            case OrderStatus.Completed: return t('orders.completed');
            case OrderStatus.Delivered: return t('orders.delivered');
            case OrderStatus.Cancelled: return t('orders.cancelled');
            case 'All': return t('orders.all');
            default: return tab;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('orders.title')}</h2>
                <Link to="/orders/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-indigo-700 transition-colors">
                    {t('orders.newOrder')}
                </Link>
            </div>

            <div className="border-b border-gray-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
                            }`}
                        >
                            {getTabName(tab)} ({tab === 'All' ? orders.length : orders.filter(o => o.status === tab).length})
                        </button>
                    ))}
                </nav>
            </div>
            
            {filteredOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400">No orders found in this category.</p>
                </div>
            )}
        </div>
    );
};
