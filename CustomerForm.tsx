import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppState, useLocalization } from '../contexts/DataProvider';
import type { Customer, Measurement, GarmentType } from '../types';
import { Button, Input, Textarea, Select, PlusIcon } from './ui';

interface MeasurementSet {
    id?: string;
    garmentType: GarmentType;
    measurements: Record<string, number>;
}

export const CustomerForm: React.FC<{ customer?: Customer; onClose: () => void; onSave?: (customer: Customer) => void }> = ({ customer, onClose, onSave }) => {
    const dispatch = useAppDispatch();
    const { t } = useLocalization();
    const { garmentTypes, measurements: allMeasurements } = useAppState();
    
    const [formData, setFormData] = useState({
        fullName: customer?.fullName || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
    });
    
    const [localMeasurements, setLocalMeasurements] = useState<MeasurementSet[]>([]);

    useEffect(() => {
        if (customer) {
            const customerMeasurements = allMeasurements
                .filter(m => m.customerId === customer.id)
                // Get the latest measurement for each garment type
                .reduce((acc, m) => {
                    acc[m.garmentType] = m;
                    return acc;
                }, {} as Record<GarmentType, Measurement>);
            
            setLocalMeasurements(Object.values(customerMeasurements).map(m => ({
                id: m.id,
                garmentType: m.garmentType,
                measurements: m.measurements
            })));
        }
    }, [customer, allMeasurements]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddMeasurementSet = () => {
        setLocalMeasurements([...localMeasurements, { garmentType: garmentTypes[0]?.name || '', measurements: {} }]);
    };
    
    const handleMeasurementChange = (index: number, field: keyof MeasurementSet, value: any) => {
        const updated = [...localMeasurements];
        updated[index] = { ...updated[index], [field]: value };
        setLocalMeasurements(updated);
    };

    const handleMeasurementValueChange = (mIndex: number, key: string, value: string) => {
        const updated = [...localMeasurements];
        const newMeasurements = { ...updated[mIndex].measurements, [key]: parseFloat(value) || 0 };
        updated[mIndex] = { ...updated[mIndex], measurements: newMeasurements };
        setLocalMeasurements(updated);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let savedCustomer: Customer;
        if (customer) {
            // Update
            savedCustomer = { ...customer, ...formData };
            dispatch({ type: 'UPDATE_CUSTOMER', payload: savedCustomer });
        } else {
            // Create
            savedCustomer = {
                id: `C${Date.now()}`,
                createdAt: new Date().toISOString(),
                ...formData
            };
            dispatch({ type: 'ADD_CUSTOMER', payload: savedCustomer });
        }

        // Save measurements
        localMeasurements.forEach(mSet => {
            if (mSet.id) { // Existing measurement
                dispatch({
                    type: 'UPDATE_MEASUREMENT',
                    payload: {
                        ...allMeasurements.find(m => m.id === mSet.id)!,
                        measurements: mSet.measurements
                    }
                })
            } else { // New measurement
                dispatch({
                    type: 'ADD_MEASUREMENT',
                    payload: {
                        id: `M${Date.now()}${Math.random()}`,
                        customerId: savedCustomer.id,
                        garmentType: mSet.garmentType,
                        measurements: mSet.measurements,
                        createdAt: new Date().toISOString()
                    }
                });
            }
        });
        
        if (onSave) onSave(savedCustomer);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('customers.name')} name="fullName" value={formData.fullName} onChange={handleChange} required />
            <Input label={t('customers.phone')} name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
            <Textarea label={t('customers.address')} name="address" value={formData.address} onChange={handleChange} rows={3} />
            
            <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Measurements</h3>
                {localMeasurements.map((mSet, index) => {
                    const selectedGarment = garmentTypes.find(g => g.name === mSet.garmentType);
                    return (
                        <div key={index} className="p-4 border rounded-lg dark:border-slate-700 space-y-3">
                            <Select label="Garment Type" value={mSet.garmentType} onChange={e => handleMeasurementChange(index, 'garmentType', e.target.value)}>
                                <option disabled value="">-- Select --</option>
                                {garmentTypes.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                            </Select>
                             {selectedGarment && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {selectedGarment.measurementFields.map(field => (
                                        <div key={field}>
                                            <label className="text-xs capitalize text-slate-600 dark:text-slate-400">{field}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.25"
                                                    value={mSet.measurements[field] || ''}
                                                    onChange={e => handleMeasurementValueChange(index, field, e.target.value)}
                                                    className="w-full pl-2 pr-8 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 text-sm"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">in</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                    )
                })}
                 <Button type="button" variant="secondary" onClick={handleAddMeasurementSet}><PlusIcon className="w-4 h-4 mr-2" /> Add Measurement Set</Button>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>{t('form.cancel')}</Button>
                <Button type="submit">{t('form.save')}</Button>
            </div>
        </form>
    );
};