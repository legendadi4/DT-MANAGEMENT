import React from 'react';
import type { Order, Customer, ShopInfo } from '../types';

interface InvoicePreviewProps {
    order: Order;
    customer: Customer;
    shopInfo: ShopInfo;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ order, customer, shopInfo }) => {
    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

    return (
        <div id="printable-invoice" className="bg-white p-4 sm:p-8 text-gray-900 text-sm font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{shopInfo.name}</h1>
                    <p className="text-gray-500">{shopInfo.tagline}</p>
                    <p className="text-xs text-gray-500 mt-2">{shopInfo.address}</p>
                    <p className="text-xs text-gray-500 mt-1">Ph: {shopInfo.phone}</p>
                </div>
                <div className="text-left sm:text-right mt-4 sm:mt-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-700">INVOICE</h2>
                    <p className="text-gray-600">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">Date: {new Date(order.orderDate).toLocaleDateString('en-IN')}</p>
                </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div>
                    <h3 className="font-semibold text-gray-600 uppercase tracking-wider text-xs">Bill To</h3>
                    <p className="font-medium text-gray-800">{customer.fullName}</p>
                    <p className="text-gray-600">{customer.address}</p>
                    <p className="text-gray-600">{customer.phone}</p>
                </div>
                <div className="text-left sm:text-right">
                     <p className="text-gray-600">Due Date: <span className="font-medium text-gray-800">{new Date(order.dueDate).toLocaleDateString('en-IN')}</span></p>
                </div>
            </div>

            {/* Items Table */}
            <div className="mt-8 overflow-x-auto">
                <table className="w-full text-left min-w-[400px]">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="p-2 text-xs text-gray-600 uppercase font-semibold tracking-wider">Item Description</th>
                            <th className="p-2 text-right text-xs text-gray-600 uppercase font-semibold tracking-wider">Qty</th>
                            <th className="p-2 text-right text-xs text-gray-600 uppercase font-semibold tracking-wider">Rate</th>
                            <th className="p-2 text-right text-xs text-gray-600 uppercase font-semibold tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {order.items.map(item => (
                            <tr key={item.id} className="text-gray-800">
                                <td className="p-2 font-medium">{item.garmentType}</td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">{currencyFormatter.format(item.unitPrice)}</td>
                                <td className="p-2 text-right">{currencyFormatter.format(item.unitPrice * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mt-8">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{currencyFormatter.format(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Discount</span>
                        <span>- {currencyFormatter.format(order.discount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-800 text-base pt-2 border-t">
                        <span>Total</span>
                        <span>{currencyFormatter.format(order.total)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Amount Paid</span>
                        <span>{currencyFormatter.format(order.total - order.balance)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-indigo-600 p-2 bg-indigo-50 rounded">
                        <span>Balance Due</span>
                        <span>{currencyFormatter.format(order.balance)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-4 border-t text-center text-xs text-gray-500">
                <p>Thank you for your business!</p>
            </div>
        </div>
    );
};