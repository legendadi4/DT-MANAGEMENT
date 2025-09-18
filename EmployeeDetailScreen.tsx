import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppState, useLocalization, useAppDispatch } from '../../contexts/DataProvider';
import { Order, EmployeePayment } from '../../types';
import { Card, Button, Modal, Input, Textarea, WhatsAppIcon, DownloadIcon } from '../ui';
import { EmployeeForm } from '../EmployeeForm';
import { EmployeeStatement } from '../EmployeeStatement';

declare var html2pdf: any;

interface LedgerEntry {
    date: string;
    type: 'work' | 'payment';
    particulars: string;
    credit: number;
    debit: number;
    orderId?: string;
}

const KpiCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className={`p-4 rounded-lg ${color}`}>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);


export const EmployeeDetailScreen: React.FC = () => {
    const { employeeId } = useParams<{ employeeId: string }>();
    const navigate = useNavigate();
    const { employees, orders, customers, shopInfo } = useAppState();
    const { t } = useLocalization();
    const dispatch = useAppDispatch();
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
    
    const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
    const [paymentNotes, setPaymentNotes] = useState('');

    const employee = employees.find(e => e.id === employeeId);
    
    const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c.fullName])), [customers]);

    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

    const { totalEarned, totalPaid, balance, ledgerEntries } = useMemo(() => {
        if (!employee) return { totalEarned: 0, totalPaid: 0, balance: 0, ledgerEntries: [] };

        const workEntries: LedgerEntry[] = [];
        orders.forEach(order => {
            order.items.forEach(item => {
                item.assignments.forEach(assignment => {
                    if (assignment.employeeId === employee.id && assignment.payment > 0) {
                        workEntries.push({
                            date: order.orderDate,
                            type: 'work',
                            particulars: `${item.garmentType} for ${customerMap.get(order.customerId) || 'Unknown'} (Order ${order.orderNumber})`,
                            credit: assignment.payment,
                            debit: 0,
                            orderId: order.id
                        });
                    }
                });
            });
        });

        const paymentEntries: LedgerEntry[] = (employee.payments || []).map(p => ({
            date: p.date,
            type: 'payment',
            particulars: p.notes || 'Payment Received',
            credit: 0,
            debit: p.amount
        }));
        
        const allEntries = [...workEntries, ...paymentEntries].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const earned = workEntries.reduce((sum, entry) => sum + entry.credit, 0);
        const paid = paymentEntries.reduce((sum, entry) => sum + entry.debit, 0);
        
        return {
            totalEarned: earned,
            totalPaid: paid,
            balance: earned - paid,
            ledgerEntries: allEntries
        }

    }, [employee, orders, customerMap]);

    // Derived state for statements: only show transactions since the last time the balance was zero.
    const { statementLedgerEntries, statementSummary } = useMemo(() => {
        if (ledgerEntries.length === 0) {
            return {
                statementLedgerEntries: [],
                statementSummary: { totalEarned: 0, totalPaid: 0, balance: 0 },
            };
        }

        const zeroBalanceIndexes: number[] = [];
        let runningBalance = 0;
        ledgerEntries.forEach((entry, index) => {
            runningBalance += entry.credit - entry.debit;
            if (runningBalance === 0) {
                zeroBalanceIndexes.push(index);
            }
        });

        let startIndex = 0;
        const lastEntryIndex = ledgerEntries.length - 1;

        if (zeroBalanceIndexes.length > 0) {
            const lastZeroIndex = zeroBalanceIndexes[zeroBalanceIndexes.length - 1];
            if (lastZeroIndex === lastEntryIndex) {
                if (zeroBalanceIndexes.length > 1) {
                    const secondToLastZeroIndex = zeroBalanceIndexes[zeroBalanceIndexes.length - 2];
                    startIndex = secondToLastZeroIndex + 1;
                } else {
                    startIndex = 0;
                }
            } else {
                startIndex = lastZeroIndex + 1;
            }
        }

        const filteredEntries = ledgerEntries.slice(startIndex);
        const statementEarned = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
        const statementPaid = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);

        const summary = {
            totalEarned: statementEarned,
            totalPaid: statementPaid,
            balance: statementEarned - statementPaid,
        };

        return { statementLedgerEntries: filteredEntries, statementSummary: summary };
    }, [ledgerEntries]);


    if (!employee) {
        return <div className="text-center py-12">Employee not found.</div>;
    }

    const handleAddPayment = () => {
        if (!paymentAmount || paymentAmount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        const newPayment: EmployeePayment = {
            id: `EP${Date.now()}`,
            amount: paymentAmount,
            date: new Date().toISOString(),
            notes: paymentNotes
        };
        
        const updatedEmployee = {
            ...employee,
            payments: [...(employee.payments || []), newPayment]
        };
        
        dispatch({ type: 'UPDATE_EMPLOYEE', payload: updatedEmployee });
        
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
        setPaymentNotes('');
    };

    const handleShare = () => {
        if (!employee.phone) {
             alert("Employee phone number is not available. Please add it first by editing employee details.");
             return;
        }

        const message = `
Hello ${employee.name},
Here is your payment summary from ${shopInfo.name}:

*Total Earned:* ${currencyFormatter.format(statementSummary.totalEarned)}
*Total Paid:* ${currencyFormatter.format(statementSummary.totalPaid)}
*Balance Due:* ${currencyFormatter.format(statementSummary.balance)}

Thank you for your work!
        `.trim().replace(/^\s+/gm, '');
        
        const whatsappUrl = `https://wa.me/91${employee.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleDownloadStatementPdf = () => {
        const originalElement = document.getElementById('printable-statement');
        if (!originalElement) {
            console.error("Statement element not found for PDF generation.");
            alert("Could not generate PDF. Printable element not found.");
            return;
        }

        // 1. Create and show a loading overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '10000';
        overlay.innerHTML = '<p style="color: white; font-size: 1.2rem;">Generating PDF...</p>';
        document.body.appendChild(overlay);

        // 2. Clone the element and prepare it for rendering
        const elementToPrint = originalElement.cloneNode(true) as HTMLElement;
        elementToPrint.style.position = 'absolute';
        elementToPrint.style.top = '0';
        elementToPrint.style.left = '0';
        elementToPrint.style.zIndex = '9999'; // Below overlay
        elementToPrint.style.width = '8.5in'; // Standard page width
        elementToPrint.style.backgroundColor = 'white';
        document.body.appendChild(elementToPrint);

        const opt = {
            margin: 0.5,
            filename: `Statement-${employee.name.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0,10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // 3. Generate PDF after a short delay to ensure rendering
        setTimeout(() => {
            html2pdf().from(elementToPrint).set(opt).save()
                .then(() => {
                    // 4. Cleanup
                    document.body.removeChild(elementToPrint);
                    document.body.removeChild(overlay);
                })
                .catch((error: any) => {
                    console.error("Error generating PDF:", error);
                    alert("An error occurred while generating the PDF.");
                    // 4. Cleanup
                    document.body.removeChild(elementToPrint);
                    document.body.removeChild(overlay);
                });
        }, 100);
    };


    return (
        <div className="space-y-6">
            <Button variant="secondary" onClick={() => navigate('/employees')}>&larr; Back to Employees</Button>
            
            <Card>
                <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-t-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{employee.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">{employee.role}</p>
                            {employee.phone && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">📞 {employee.phone}</p>}
                        </div>
                        <div className="flex gap-2">
                             <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>Edit Details</Button>
                        </div>
                    </div>
                     <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-white">
                        <KpiCard title="Total Earned (All Time)" value={currencyFormatter.format(totalEarned)} color="bg-green-500 dark:bg-green-700" />
                        <KpiCard title="Total Paid (All Time)" value={currencyFormatter.format(totalPaid)} color="bg-red-500 dark:bg-red-700" />
                        <KpiCard title="Current Balance Due" value={currencyFormatter.format(balance)} color="bg-indigo-600 dark:bg-indigo-800" />
                    </div>
                </div>

                <div className="p-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                           Transaction History (All Time)
                        </h3>
                        <div className="flex gap-2">
                            <Button onClick={() => setIsPaymentModalOpen(true)}>Pay Employee</Button>
                            <Button variant="secondary" onClick={() => setIsStatementModalOpen(true)}>Generate Statement</Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto border dark:border-slate-700 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700 text-left">
                                <tr>
                                    <th className="p-3 font-medium">Date</th>
                                    <th className="p-3 font-medium">Particulars</th>
                                    <th className="p-3 font-medium text-right">Credit (Earned)</th>
                                    <th className="p-3 font-medium text-right">Debit (Paid)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-700">
                                {ledgerEntries.map((entry, index) => (
                                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString('en-IN')}</td>
                                        <td className="p-3">
                                            {entry.particulars}
                                            {entry.orderId && <Link to={`/orders/${entry.orderId}`} className="text-indigo-500 text-xs ml-2 hover:underline">[View Order]</Link>}
                                        </td>
                                        <td className="p-3 text-right font-mono text-green-600 dark:text-green-400">{entry.credit > 0 ? currencyFormatter.format(entry.credit) : '-'}</td>
                                        <td className="p-3 text-right font-mono text-red-600 dark:text-red-400">{entry.debit > 0 ? currencyFormatter.format(entry.debit) : '-'}</td>
                                    </tr>
                                ))}
                                {ledgerEntries.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-slate-500 dark:text-slate-400">No transactions recorded.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('employees.editEmployee')}>
                <EmployeeForm employee={employee} onClose={() => setIsEditModalOpen(false)} />
            </Modal>
            
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Pay ${employee.name}`}>
                <div className="space-y-4">
                    <p>Current Balance: <span className="font-bold">{currencyFormatter.format(balance)}</span></p>
                    <Input label="Amount to Pay" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} required autoFocus />
                    <Textarea label="Notes (Optional)" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="e.g., Advance for May" />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddPayment}>Record Payment</Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isStatementModalOpen} onClose={() => setIsStatementModalOpen(false)} title="Employee Statement" size="xl">
                <EmployeeStatement 
                    employee={employee} 
                    ledgerEntries={statementLedgerEntries} 
                    summary={statementSummary}
                    shopInfo={shopInfo}
                />
                 <div className="mt-4 flex justify-end gap-2 no-print">
                    <Button variant="secondary" onClick={() => setIsStatementModalOpen(false)}>Close</Button>
                    <Button onClick={handleShare} className="bg-green-500 hover:bg-green-600 focus:ring-green-500">
                        <WhatsAppIcon className="w-4 h-4 mr-2" /> Share
                    </Button>
                    <Button variant="secondary" onClick={handleDownloadStatementPdf}><DownloadIcon className="w-4 h-4 mr-2"/>Download PDF</Button>
                    <Button onClick={() => window.print()}>Print</Button>
                </div>
            </Modal>
        </div>
    );
};