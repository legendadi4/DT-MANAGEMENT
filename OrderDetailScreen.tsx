
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppState, useAppDispatch, useLocalization } from '../../contexts/DataProvider';
import { OrderStatus, Payment, WorkAssignment, LineItem } from '../../types';
import { Card, Badge, Button, Modal, Input, Select, PlusIcon, TrashIcon, DownloadIcon, WhatsAppIcon } from '../ui';
import { STATUS_COLORS } from '../../constants';
import { InvoicePreview } from '../Invoice';

declare var html2pdf: any;

interface GroupedAssignment {
    uiId: number;
    employeeId: string;
    quantity: number;
    payment: number;
}

const ItemAssignments: React.FC<{
    item: LineItem;
    onSave: (itemId: string, newAssignments: WorkAssignment[]) => void;
    isOrderActive: boolean;
}> = ({ item, onSave, isOrderActive }) => {
    const { employees } = useAppState();
    const [groups, setGroups] = useState<GroupedAssignment[]>([]);

    useEffect(() => {
        const assignmentGroups = new Map<string, { quantity: number; payment: number }>();
        for (const assignment of item.assignments) {
            if (assignment.employeeId) {
                const existing = assignmentGroups.get(assignment.employeeId) || { quantity: 0, payment: assignment.payment };
                existing.quantity++;
                // Let's assume payment is the same for the same employee on the same item
                existing.payment = assignment.payment; 
                assignmentGroups.set(assignment.employeeId, existing);
            }
        }
        setGroups(
            Array.from(assignmentGroups.entries()).map(([employeeId, data]) => ({
                uiId: Math.random(),
                employeeId,
                ...data,
            }))
        );
    }, [item.assignments]);
    
    const saveChanges = (updatedGroups: GroupedAssignment[]) => {
        const totalAssigned = updatedGroups.reduce((sum, g) => sum + (Number(g.quantity) || 0), 0);
        if (totalAssigned > item.quantity) {
             alert(`Cannot assign more than ${item.quantity} units.`);
             return;
        }

        const newAssignments: WorkAssignment[] = [];
        
        // Create assignments for each group
        updatedGroups.forEach(group => {
            if(group.employeeId && group.quantity > 0) {
                for(let i=0; i<group.quantity; i++) {
                    newAssignments.push({
                        id: `${item.id}-${group.employeeId}-${i}`, // semi-stable ID
                        employeeId: group.employeeId,
                        payment: Number(group.payment) || 0,
                        workPhoto: undefined, // Photos are cleared on re-assignment for simplicity
                    });
                }
            }
        });

        // Fill remaining with unassigned
        const unassignedCount = item.quantity - newAssignments.length;
        for (let i = 0; i < unassignedCount; i++) {
            newAssignments.push({
                id: `${item.id}-unassigned-${i}`,
                employeeId: undefined,
                payment: 0,
                workPhoto: undefined,
            });
        }
        onSave(item.id, newAssignments);
    };

    const handleGroupChange = (uiId: number, field: keyof GroupedAssignment, value: string | number) => {
        const updatedGroups = groups.map(g => g.uiId === uiId ? { ...g, [field]: value } : g);
        setGroups(updatedGroups);
    };
    
    const addGroup = () => {
        const newGroup = { uiId: Math.random(), employeeId: '', quantity: 1, payment: 0 };
        setGroups([...groups, newGroup]);
    };
    
    const removeGroup = (uiId: number) => {
        const updatedGroups = groups.filter(g => g.uiId !== uiId);
        setGroups(updatedGroups);
        saveChanges(updatedGroups);
    };

    const assignedCount = groups.reduce((sum, g) => sum + (Number(g.quantity) || 0), 0);
    const unassignedCount = item.quantity - assignedCount;

    return (
        <div className="space-y-3 pt-2">
             <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md border dark:border-slate-600 space-y-3">
                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Work Assignments</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Total: {item.quantity} units | Assigned: {assignedCount} | <span className={unassignedCount > 0 ? 'text-amber-500 font-bold' : ''}>Unassigned: {unassignedCount}</span>
                    </p>
                </div>
                
                {groups.map(group => (
                    <div key={group.uiId} className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
                       <div className="flex-grow min-w-[150px]">
                            <Select
                                label="Employee"
                                value={group.employeeId}
                                onChange={e => handleGroupChange(group.uiId, 'employeeId', e.target.value)}
                                onBlur={() => saveChanges(groups)}
                                disabled={!isOrderActive}
                            >
                                <option value="">-- Select --</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                                ))}
                            </Select>
                       </div>
                       <div className="w-20">
                            <Input
                                label="Units"
                                type="number"
                                min="1"
                                value={group.quantity}
                                onChange={e => handleGroupChange(group.uiId, 'quantity', parseInt(e.target.value, 10))}
                                onBlur={() => saveChanges(groups)}
                                disabled={!isOrderActive}
                            />
                       </div>
                        <div className="w-28">
                            <Input
                                label="Payment (₹)/unit"
                                type="number"
                                min="0"
                                value={group.payment}
                                onChange={e => handleGroupChange(group.uiId, 'payment', parseFloat(e.target.value))}
                                onBlur={() => saveChanges(groups)}
                                disabled={!isOrderActive}
                            />
                        </div>
                        <Button variant="danger" onClick={() => removeGroup(group.uiId)} disabled={!isOrderActive} className="!p-2 h-10">
                            <TrashIcon className="w-5 h-5"/>
                        </Button>
                    </div>
                ))}
                
                {isOrderActive && (
                    <Button variant="secondary" onClick={addGroup} size="sm">
                        <PlusIcon className="w-4 h-4 mr-1"/>
                        Add Assignment
                    </Button>
                )}
            </div>
        </div>
    );
};


export const OrderDetailScreen: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { orders, customers, employees, shopInfo } = useAppState();
    const dispatch = useAppDispatch();
    const { t } = useLocalization();

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);

    const order = orders.find(o => o.id === orderId);
    const customer = customers.find(c => c.id === order?.customerId);

    if (!order || !customer) {
        return <div className="text-center py-12">Order not found.</div>;
    }

    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
    const isOrderActive = ![OrderStatus.Completed, OrderStatus.Delivered, OrderStatus.Cancelled].includes(order.status);


    const handleStatusChange = (newStatus: OrderStatus) => {
        dispatch({ type: 'UPDATE_ORDER', payload: { ...order, status: newStatus } });
    };

    const handleSaveAssignments = useCallback((itemId: string, newAssignments: WorkAssignment[]) => {
        const updatedItems = order.items.map(item => 
            item.id === itemId ? { ...item, assignments: newAssignments } : item
        );
        dispatch({ type: 'UPDATE_ORDER', payload: { ...order, items: updatedItems } });
    }, [order, dispatch]);


    const handleAddPayment = () => {
        if (paymentAmount <= 0 || paymentAmount > order.balance) {
            alert("Invalid payment amount");
            return;
        }
        const newPayment: Payment = {
            id: `P${Date.now()}`,
            amount: paymentAmount,
            method: 'Cash',
            date: new Date().toISOString()
        };
        const updatedOrder = {
            ...order,
            payments: [...order.payments, newPayment],
            balance: order.balance - paymentAmount,
            advance: order.advance + paymentAmount
        };
        dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });
        setIsPaymentModalOpen(false);
        setPaymentAmount(0);
    };

    const handleDownloadPdf = () => {
        const originalElement = document.getElementById('printable-invoice');
        if (!originalElement) {
            console.error("Invoice element not found.");
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
            filename: `Invoice-${order.orderNumber}.pdf`,
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

    const handleShareInvoiceToWhatsApp = () => {
        if (!customer || !customer.phone) {
            alert("Customer phone number is not available.");
            return;
        }

        const message = `
Hello ${customer.fullName},
Here is your invoice summary from ${shopInfo.name}:
*Order No:* ${order.orderNumber}
*Total Amount:* ${currencyFormatter.format(order.total)}
*Amount Paid:* ${currencyFormatter.format(order.total - order.balance)}
*Balance Due:* ${currencyFormatter.format(order.balance)}
*Due Date:* ${new Date(order.dueDate).toLocaleDateString('en-IN')}

Thank you!
`.trim().replace(/^\s+/gm, '');
        
        const whatsappUrl = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="space-y-6">
            <Button variant="secondary" onClick={() => navigate('/orders')}>&larr; Back to Orders</Button>
            
            <Card>
                <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-t-xl flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Order {order.orderNumber}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{new Date(order.orderDate).toLocaleString('en-IN')}</p>
                    </div>
                    <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        {/* Items */}
                        <div>
                            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mb-2">Items</h3>
                            <div className="border dark:border-slate-700 rounded-lg divide-y dark:divide-slate-700">
                                {order.items.map((item) => (
                                    <div key={item.id} className="p-4 space-y-3">
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-slate-100">{item.quantity} x {item.garmentType}</p>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                                    Fabric: {item.fabricSource}
                                                </div>
                                            </div>
                                            <p className="font-medium text-slate-800 dark:text-slate-100">{currencyFormatter.format(item.unitPrice * item.quantity)}</p>
                                        </div>

                                        {item.photo && (
                                             <div>
                                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Reference Photo</label>
                                                <img src={item.photo} alt="Customer reference" className="w-20 h-20 object-cover rounded-md mt-1 border dark:border-slate-600" />
                                            </div>
                                        )}
                                        
                                        <ItemAssignments item={item} onSave={handleSaveAssignments} isOrderActive={isOrderActive}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                         {/* Payments */}
                        <div>
                            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mb-2">Payments</h3>
                            <div className="border dark:border-slate-700 rounded-lg p-4 space-y-2">
                                {order.payments.map(p => (
                                    <div key={p.id} className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-300">{new Date(p.date).toLocaleDateString('en-IN')} ({p.method})</span>
                                        <span className="font-medium text-slate-800 dark:text-slate-100">{currencyFormatter.format(p.amount)}</span>
                                    </div>
                                ))}
                                {order.payments.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No payments recorded yet.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Customer */}
                        <div>
                            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mb-2">Customer</h3>
                            <div className="border dark:border-slate-700 rounded-lg p-4 space-y-1">
                                <p className="font-medium text-slate-900 dark:text-slate-50">{customer.fullName}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{customer.phone}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{customer.address}</p>
                            </div>
                        </div>
                        {/* Totals */}
                         <div className="border dark:border-slate-700 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Subtotal</span><span>{currencyFormatter.format(order.subtotal)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Discount</span><span>- {currencyFormatter.format(order.discount)}</span></div>
                            <div className="flex justify-between font-bold text-base border-t dark:border-slate-700 pt-2 mt-2"><span className="text-slate-800 dark:text-slate-100">Total</span><span className="text-slate-800 dark:text-slate-100">{currencyFormatter.format(order.total)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Paid</span><span>{currencyFormatter.format(order.total - order.balance)}</span></div>
                            <div className="flex justify-between font-bold text-lg text-indigo-600 dark:text-indigo-400"><span >Balance Due</span><span>{currencyFormatter.format(order.balance)}</span></div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-b-xl flex flex-wrap gap-2 justify-between items-center">
                    <div>
                        {isOrderActive && (
                            <Button variant="danger" onClick={() => {
                                if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
                                    handleStatusChange(OrderStatus.Cancelled)
                                }
                            }}>Cancel Order</Button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                        <Link to={`/orders/${order.id}/edit`}>
                            <Button>Edit Order</Button>
                        </Link>
                        <Button variant="secondary" onClick={() => setIsInvoiceModalOpen(true)}>Print/Share Invoice</Button>
                        <Button onClick={() => setIsPaymentModalOpen(true)} disabled={order.balance <= 0}>Add Payment</Button>
                        {order.status === OrderStatus.InProgress && <Button onClick={() => handleStatusChange(OrderStatus.Completed)}>Mark as Completed</Button>}
                        {order.status === OrderStatus.Completed && <Button onClick={() => handleStatusChange(OrderStatus.Delivered)}>Mark as Delivered</Button>}
                    </div>
                </div>
            </Card>

            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Add Payment">
                <div className="space-y-4">
                    <p>Balance Due: <span className="font-bold">{currencyFormatter.format(order.balance)}</span></p>
                    <Input label="Payment Amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(parseFloat(e.target.value))} />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddPayment}>Save Payment</Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Invoice" size="xl">
                <InvoicePreview order={order} customer={customer} shopInfo={shopInfo} />
                 <div className="mt-4 flex justify-end gap-2 no-print">
                    <Button variant="secondary" onClick={() => setIsInvoiceModalOpen(false)}>Close</Button>
                    <Button onClick={handleShareInvoiceToWhatsApp} className="bg-green-500 hover:bg-green-600 focus:ring-green-500">
                        <WhatsAppIcon className="w-4 h-4 mr-2" /> Share
                    </Button>
                    <Button variant="secondary" onClick={handleDownloadPdf}><DownloadIcon className="w-4 h-4 mr-2"/>Download PDF</Button>
                    <Button onClick={() => window.print()}>Print</Button>
                </div>
            </Modal>
        </div>
    );
};
