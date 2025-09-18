



import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState, useAppDispatch, useLocalization } from '../../contexts/DataProvider';
import { OrderStatus } from '../../types';
import type { LineItem, Order, Customer, GarmentType, GarmentTypeDefinition, WorkAssignment } from '../../types';
import { Button, Card, Input, Select, Textarea, Modal, CameraIcon, TrashIcon, PlusIcon, WhatsAppIcon } from '../ui';
import { CustomerForm } from '../CustomerForm';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
  
const AddGarmentTypeModal: React.FC<{ onClose: () => void; onSave: (garmentType: GarmentTypeDefinition) => void; }> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [fields, setFields] = useState('');
    
    const handleSave = () => {
        if (!name || !fields) {
            alert('Please provide a name and comma-separated measurement fields.');
            return;
        }
        onSave({
            name,
            measurementFields: fields.split(',').map(f => f.trim()).filter(f => f),
        });
    };

    return (
        <div className="space-y-4">
            <Input label="Garment Type Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Anarkali Suit" />
            <Textarea label="Measurement Fields" value={fields} onChange={e => setFields(e.target.value)} placeholder="e.g., length, bust, waist, flair" helpText="Separate field names with a comma." />
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
            </div>
        </div>
    )
}

export const NewOrderScreen: React.FC = () => {
    const { customers, measurements, garmentTypes, employees, orders } = useAppState();
    const dispatch = useAppDispatch();
    const { t } = useLocalization();
    const navigate = useNavigate();
    const { orderId } = useParams<{ orderId: string }>();
    const isEditMode = Boolean(orderId);

    const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

    const [customerId, setCustomerId] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<Partial<LineItem>[]>([{
        id: `L${Date.now()}`,
        garmentType: garmentTypes[0]?.name || '',
        quantity: 1,
        unitPrice: 0,
        fabricSource: 'Customer',
        notes: '',
        photo: '',
        assignments: [{ id: `L${Date.now()}-A1`, employeeId: '', payment: 0 }],
    }]);
    const [notes, setNotes] = useState('');
    const [discount, setDiscount] = useState(0);
    const [advance, setAdvance] = useState(0);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isGarmentModalOpen, setIsGarmentModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [savedOrder, setSavedOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (isEditMode) {
            const foundOrder = orders.find(o => o.id === orderId);
            if (foundOrder) {
                setOrderToEdit(foundOrder);
                setCustomerId(foundOrder.customerId);
                setDueDate(foundOrder.dueDate.split('T')[0]);
                setItems(foundOrder.items);
                setNotes(foundOrder.notes || '');
                setDiscount(foundOrder.discount);
                // Advance is not set here, as it's derived from existing payments in edit mode
            } else {
                console.error("Order not found for editing");
                navigate('/orders');
            }
        }
    }, [isEditMode, orderId, orders, navigate]);


    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

    const { subtotal, total, balance } = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
        const total = subtotal - discount;
        let balance;
        if (isEditMode && orderToEdit) {
            const totalPaid = orderToEdit.payments.reduce((sum, p) => sum + p.amount, 0);
            balance = total - totalPaid;
        } else {
            balance = total - advance;
        }
        return { subtotal, total, balance };
    }, [items, discount, advance, isEditMode, orderToEdit]);

    const handleItemChange = (index: number, field: keyof Omit<LineItem, 'assignments'>, value: any) => {
        const newItems = [...items];
        const currentItem = { ...newItems[index] };
    
        if (field === 'quantity') {
            const newQuantity = Math.max(1, parseInt(value, 10) || 1);
            (currentItem as any)[field] = newQuantity;
            const currentAssignments = currentItem.assignments || [];
            const newAssignments: WorkAssignment[] = [];
            
            for (let i = 0; i < newQuantity; i++) {
                if (currentAssignments[i]) {
                    newAssignments.push(currentAssignments[i]);
                } else {
                    newAssignments.push({ id: `${currentItem.id}-A${i + 1}`, payment: 0 });
                }
            }
            currentItem.assignments = newAssignments.slice(0, newQuantity);
        } else {
            (currentItem as any)[field] = value;
        }

        newItems[index] = currentItem;
        setItems(newItems);
    };
    
    const handleAddItem = () => {
        const newItemId = `L${Date.now()}`;
        setItems([...items, {
            id: newItemId,
            garmentType: garmentTypes[0]?.name || '',
            quantity: 1,
            unitPrice: 0,
            fabricSource: 'Customer',
            notes: '',
            photo: '',
            assignments: [{ id: `${newItemId}-A1`, employeeId: '', payment: 0 }],
        }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handlePhotoUpload = async (index: number, file: File) => {
        const base64 = await fileToBase64(file);
        handleItemChange(index, 'photo', base64);
    };

    const handleAddGarmentType = (newGarmentType: GarmentTypeDefinition) => {
        dispatch({ type: 'ADD_GARMENT_TYPE', payload: newGarmentType });
        // Set the new garment type for the last item added
        const newItems = [...items];
        newItems[newItems.length - 1].garmentType = newGarmentType.name;
        setItems(newItems);
        setIsGarmentModalOpen(false);
    }
    
    const handleSave = () => {
        if (!customerId) {
            alert('Please select a customer.');
            return;
        }

        const finalItems: LineItem[] = items.map(item => {
            const customerMeasurements = measurements
                .filter(m => m.customerId === customerId && m.garmentType === item.garmentType)
                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // On save, ensure assignments don't have employeeId set yet
            const cleanAssignments = (item.assignments || []).map(a => ({
                ...a,
                employeeId: isEditMode ? a.employeeId : undefined,
            }));

            return {
                id: item.id!,
                garmentType: item.garmentType!,
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || 0,
                fabricSource: item.fabricSource || 'Customer',
                notes: item.notes,
                measurementSnapshot: customerMeasurements[0]?.measurements || {},
                photo: item.photo,
                assignments: cleanAssignments,
            };
        });

        if (isEditMode && orderToEdit) {
            const totalPaid = orderToEdit.payments.reduce((sum, p) => sum + p.amount, 0);
            const updatedOrder: Order = {
                ...orderToEdit,
                customerId,
                dueDate,
                items: finalItems,
                subtotal,
                discount,
                total,
                advance: totalPaid,
                balance: total - totalPaid,
                notes,
            };
            dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });
            navigate(`/orders/${orderId}`);

        } else {
            const newOrderId = `O${Date.now()}`;
            const newOrder: Order = {
                id: newOrderId,
                orderNumber: `DT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${newOrderId.slice(-4)}`,
                customerId,
                orderDate: new Date().toISOString(),
                dueDate,
                status: OrderStatus.InProgress,
                items: finalItems,
                subtotal,
                discount,
                total,
                advance,
                payments: advance > 0 ? [{
                    id: `P${Date.now()}`,
                    amount: advance,
                    method: 'Cash',
                    date: new Date().toISOString(),
                }] : [],
                balance,
                notes,
            };

            dispatch({ type: 'ADD_ORDER', payload: newOrder });
            setSavedOrder(newOrder);
            setIsShareModalOpen(true);
        }
    };
    
    const handleShareToWhatsApp = () => {
        const customer = customers.find(c => c.id === savedOrder?.customerId);
        if (!savedOrder || !customer || !customer.phone) {
            alert("Customer phone number is not available.");
            return;
        }

        const message = `
Hello ${customer.fullName},
Here is your order summary from Deepak Tailor:
*Order No:* ${savedOrder.orderNumber}
*Total Amount:* ${currencyFormatter.format(savedOrder.total)}
*Amount Paid:* ${currencyFormatter.format(savedOrder.advance)}
*Balance Due:* ${currencyFormatter.format(savedOrder.balance)}
*Due Date:* ${new Date(savedOrder.dueDate).toLocaleDateString('en-IN')}

Thank you!
`.trim();
        
        const whatsappUrl = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setIsShareModalOpen(false);
        navigate('/orders');
    };
    
    const closeShareModal = () => {
        setIsShareModalOpen(false);
        navigate('/orders');
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{isEditMode ? 'Edit Order' : t('orders.newOrder')}</h2>
                <Button variant="secondary" onClick={() => navigate(isEditMode ? `/orders/${orderId}` : '/orders')}>&larr; Back</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="p-6 space-y-4">
                            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Customer</h3>
                            <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                    <Select label="Select Customer" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                                        <option value="" disabled>-- Select a customer --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.fullName} - {c.phone}</option>)}
                                    </Select>
                                </div>
                                <Button variant="secondary" onClick={() => setIsCustomerModalOpen(true)}>Add New</Button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-6 space-y-4">
                            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Order Details</h3>
                            <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                            <Textarea label="Order Description / Notes" placeholder="e.g., special instructions for the whole order" value={notes} onChange={e => setNotes(e.target.value)} rows={3}/>
                        </div>
                    </Card>

                    <Card>
                         <div className="p-6 space-y-4">
                            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Items</h3>
                            <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={item.id} className="border dark:border-slate-700 rounded-lg p-4 space-y-4 relative">
                                    <button onClick={() => handleRemoveItem(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-end gap-2">
                                            <div className="flex-grow">
                                                <Select label="Garment Type" value={item.garmentType} onChange={e => handleItemChange(index, 'garmentType', e.target.value as GarmentType)}>
                                                    {garmentTypes.map(gt => <option key={gt.name} value={gt.name}>{gt.name}</option>)}
                                                </Select>
                                            </div>
                                            <Button variant="secondary" onClick={() => setIsGarmentModalOpen(true)} className="!p-2"><PlusIcon className="w-5 h-5"/></Button>
                                        </div>
                                        <div> {/* Placeholder for grid layout */} </div>
                                        <Input label="Quantity" type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} onFocus={e => e.target.select()} />
                                        <Input label="Unit Price" type="number" min="0" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fabric Source:</label>
                                        <div className="flex items-center gap-2">
                                            <input type="radio" id={`fabricCustomer${index}`} name={`fabricSource${index}`} value="Customer" checked={item.fabricSource === 'Customer'} onChange={e => handleItemChange(index, 'fabricSource', e.target.value)} className="dark:bg-slate-700"/>
                                            <label htmlFor={`fabricCustomer${index}`}>Customer</label>
                                        </div>
                                         <div className="flex items-center gap-2">
                                            <input type="radio" id={`fabricShop${index}`} name={`fabricSource${index}`} value="Shop" checked={item.fabricSource === 'Shop'} onChange={e => handleItemChange(index, 'fabricSource', e.target.value)} className="dark:bg-slate-700"/>
                                            <label htmlFor={`fabricShop${index}`}>Shop</label>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        {item.photo && <img src={item.photo} alt="Garment preview" className="w-20 h-20 rounded object-cover" />}
                                        <div className="flex-grow">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reference Photo</label>
                                            <input type="file" accept="image/*" capture="environment" onChange={e => e.target.files && handlePhotoUpload(index, e.target.files[0])} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-slate-600 dark:file:text-slate-200 dark:hover:file:bg-slate-500" />
                                        </div>
                                    </div>
                                    <Textarea label="Item Notes (Design, Pattern, etc.)" value={item.notes} onChange={e => handleItemChange(index, 'notes', e.target.value)} rows={2} placeholder="e.g., V-neck, puff sleeves" />
                                </div>
                            ))}
                            </div>
                            <Button variant="secondary" onClick={handleAddItem}>Add Another Item</Button>
                         </div>
                    </Card>
                </div>

                <div className="space-y-6 lg:col-span-1">
                    <Card>
                        <div className="p-6 space-y-3">
                            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Summary</h3>
                             <div className="border dark:border-slate-700 rounded-lg p-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Subtotal</span><span>{currencyFormatter.format(subtotal)}</span></div>
                                <div className="flex justify-between items-center">
                                    <label htmlFor="discount" className="text-slate-600 dark:text-slate-300">Discount</label>
                                    <Input id="discount" label="" type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 text-right" onFocus={e => e.target.select()} />
                                </div>
                                <div className="flex justify-between font-bold text-base border-t dark:border-slate-700 pt-2 mt-2"><span className="text-slate-800 dark:text-slate-100">Total</span><span className="text-slate-800 dark:text-slate-100">{currencyFormatter.format(total)}</span></div>
                                
                                {isEditMode && orderToEdit ? (
                                    <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Total Paid</span><span>{currencyFormatter.format(orderToEdit.payments.reduce((sum, p) => sum + p.amount, 0))}</span></div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="advance" className="text-slate-600 dark:text-slate-300">Advance Paid</label>
                                        <Input id="advance" label="" type="number" value={advance} onChange={e => setAdvance(parseFloat(e.target.value) || 0)} className="w-24 text-right" onFocus={e => e.target.select()} />
                                    </div>
                                )}

                                <div className="flex justify-between font-bold text-lg text-indigo-600 dark:text-indigo-400 p-2 bg-indigo-50 dark:bg-indigo-900/50 rounded mt-2"><span >Balance Due</span><span>{currencyFormatter.format(balance)}</span></div>
                            </div>
                            <Button onClick={handleSave} disabled={!customerId || items.length === 0} className="w-full">{isEditMode ? 'Save Changes' : t('form.save')}</Button>
                        </div>
                    </Card>
                </div>
            </div>

            <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title={t('customers.newCustomer')} size="lg">
                <CustomerForm onClose={() => setIsCustomerModalOpen(false)} onSave={(c) => setCustomerId(c.id)} />
            </Modal>
            
            <Modal isOpen={isGarmentModalOpen} onClose={() => setIsGarmentModalOpen(false)} title="Add New Garment Type">
                <AddGarmentTypeModal onClose={() => setIsGarmentModalOpen(false)} onSave={handleAddGarmentType} />
            </Modal>

            <Modal isOpen={isShareModalOpen} onClose={closeShareModal} title="Order Saved!">
                <div className="text-center space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">The order has been saved successfully. Would you like to share the bill with the customer?</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button onClick={handleShareToWhatsApp} className="w-full bg-green-500 hover:bg-green-600 focus:ring-green-500">
                           <WhatsAppIcon className="w-5 h-5 mr-2" /> Share on WhatsApp
                        </Button>
                        <Button variant="secondary" onClick={closeShareModal} className="w-full">
                            No, Thanks
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
