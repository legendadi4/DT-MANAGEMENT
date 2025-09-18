

import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppState } from '../../contexts/DataProvider';
import { Card, Button, Badge } from '../ui';
import { STATUS_COLORS } from '../../constants';
import { OrderStatus } from '../../types';

// A simple KPI card for this screen
const KpiCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className={`p-4 rounded-lg ${color}`}>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);

export const CustomerDetailScreen: React.FC = () => {
    const { customerId } = useParams<{ customerId: string }>();
    const navigate = useNavigate();
    const { customers, orders } = useAppState();

    const customer = customers.find(c => c.id === customerId);
    
    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

    const { customerOrders, totalBilled, totalPaid, totalBalance } = useMemo(() => {
        if (!customer) return { customerOrders: [], totalBilled: 0, totalPaid: 0, totalBalance: 0 };
        
        const customerOrders = orders
            .filter(o => o.customerId === customer.id)
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
            
        const totalBilled = customerOrders.reduce((sum, order) => sum + order.total, 0);
        const totalPaid = customerOrders.reduce((sum, order) => sum + (order.total - order.balance), 0);
        const totalBalance = totalBilled - totalPaid;

        return { customerOrders, totalBilled, totalPaid, totalBalance };
    }, [customer, orders]);

    if (!customer) {
        return <div className="text-center py-12">Customer not found.</div>;
    }

    return (
        <div className="space-y-6">
            <Button variant="secondary" onClick={() => navigate('/customers')}>&larr; Back to Customers</Button>
            
            <Card>
                <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{customer.fullName}</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">{customer.phone}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{customer.address}</p>
                    </div>
                </div>
                 <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-white">
                    <KpiCard title="Total Billed" value={currencyFormatter.format(totalBilled)} color="bg-blue-500 dark:bg-blue-700" />
                    <KpiCard title="Total Paid" value={currencyFormatter.format(totalPaid)} color="bg-green-500 dark:bg-green-700" />
                    <KpiCard title="Total Balance Due" value={currencyFormatter.format(totalBalance)} color="bg-amber-500 dark:bg-amber-700" />
                </div>
            </Card>

            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                       Order History
                    </h3>
                    <div className="overflow-x-auto border dark:border-slate-700 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700 text-left">
                                <tr>
                                    <th className="p-3 font-medium">Order #</th>
                                    <th className="p-3 font-medium">Date</th>
                                    <th className="p-3 font-medium text-right">Total</th>
                                    <th className="p-3 font-medium text-right">Balance</th>
                                    <th className="p-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-700">
                                {customerOrders.map(order => {
                                    const isNew = (new Date().getTime() - new Date(order.orderDate).getTime()) < 24 * 60 * 60 * 1000;
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="p-3 whitespace-nowrap">
                                                <Link to={`/orders/${order.id}`} className="text-indigo-500 hover:underline">{order.orderNumber}</Link>
                                                {isNew && <Badge className={`ml-2 ${STATUS_COLORS[OrderStatus.New]}`}>New</Badge>}
                                            </td>
                                            <td className="p-3 whitespace-nowrap">{new Date(order.orderDate).toLocaleDateString('en-IN')}</td>
                                            <td className="p-3 text-right font-mono">{currencyFormatter.format(order.total)}</td>
                                            <td className="p-3 text-right font-mono font-bold text-red-600 dark:text-red-400">{currencyFormatter.format(order.balance)}</td>
                                            <td className="p-3"><Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge></td>
                                        </tr>
                                    );
                                })}
                                {customerOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-slate-500 dark:text-slate-400">No orders found for this customer.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};
