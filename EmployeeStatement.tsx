import React from 'react';
import type { Employee, ShopInfo } from '../types';

interface LedgerEntry {
    date: string;
    type: 'work' | 'payment';
    particulars: string;
    credit: number;
    debit: number;
    orderId?: string;
}

interface StatementProps {
    employee: Employee;
    ledgerEntries: LedgerEntry[];
    summary: { totalEarned: number; totalPaid: number; balance: number };
    shopInfo: ShopInfo;
}

export const EmployeeStatement: React.FC<StatementProps> = ({ employee, ledgerEntries, summary, shopInfo }) => {
    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
    let runningBalance = 0;

    return (
        <div id="printable-statement" className="bg-white p-4 sm:p-8 text-gray-800 text-sm font-sans">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start pb-6 mb-8 border-b-2 border-gray-200">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">{shopInfo.name}</h1>
                    <p className="text-gray-500 mt-1">{shopInfo.address}</p>
                    <p className="text-gray-500 mt-1">Ph: {shopInfo.phone}</p>
                </div>
                <div className="text-left sm:text-right mt-4 sm:mt-0">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 tracking-widest">EMPLOYEE STATEMENT</h2>
                    <p className="text-gray-500 mt-1">Date: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
            </header>

            {/* Employee Info */}
            <section className="mb-10">
                <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-xs mb-2">Statement For</h3>
                <p className="font-bold text-gray-800 text-xl">{employee.name}</p>
                <p className="text-gray-600">{employee.role}</p>
            </section>

            {/* Ledger Table */}
            <main className="mt-8 overflow-x-auto">
                <table className="w-full text-left min-w-[550px]">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-3 text-xs text-gray-600 uppercase font-semibold tracking-wider">Date</th>
                            <th className="p-3 text-xs text-gray-600 uppercase font-semibold tracking-wider">Particulars</th>
                            <th className="p-3 text-right text-xs text-gray-600 uppercase font-semibold tracking-wider">Credit (+)</th>
                            <th className="p-3 text-right text-xs text-gray-600 uppercase font-semibold tracking-wider">Debit (-)</th>
                            <th className="p-3 text-right text-xs text-gray-600 uppercase font-semibold tracking-wider">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {ledgerEntries.map((entry, index) => {
                            runningBalance += entry.credit - entry.debit;
                            return (
                                <tr key={index} className="[&>td]:p-3 even:bg-gray-50">
                                    <td className="whitespace-nowrap text-gray-600">{new Date(entry.date).toLocaleDateString('en-IN')}</td>
                                    <td className="font-medium text-gray-800">{entry.particulars}</td>
                                    <td className="text-right text-green-600 font-semibold">{entry.credit > 0 ? currencyFormatter.format(entry.credit) : ''}</td>
                                    <td className="text-right text-red-600 font-semibold">{entry.debit > 0 ? currencyFormatter.format(entry.debit) : ''}</td>
                                    <td className="text-right font-semibold text-gray-900">{currencyFormatter.format(runningBalance)}</td>
                                </tr>
                            );
                        })}
                         {ledgerEntries.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-6 text-center text-gray-500">No transactions to display for this period.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </main>

            {/* Totals Section */}
            <section className="flex justify-end mt-8">
                <div className="w-full max-w-sm space-y-3">
                    <div className="flex justify-between text-gray-600">
                        <span>Total Earned</span>
                        <span className="font-medium">{currencyFormatter.format(summary.totalEarned)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Total Paid</span>
                        <span className="font-medium">- {currencyFormatter.format(summary.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl text-indigo-700 p-3 bg-indigo-50 rounded-lg mt-2 border border-indigo-200">
                        <span>Balance Due</span>
                        <span>{currencyFormatter.format(summary.balance)}</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-12 pt-6 border-t text-center text-xs text-gray-500">
                <p>This is a computer-generated statement and does not require a signature.</p>
                <p>Thank you for your hard work!</p>
            </footer>
        </div>
    );
};