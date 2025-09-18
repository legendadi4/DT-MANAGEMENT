
import React, { useState } from 'react';
import { useAppDispatch, useLocalization } from '../contexts/DataProvider';
import type { Employee } from '../types';
import { Button, Input } from './ui';

interface EmployeeFormProps {
    employee?: Employee;
    onClose: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onClose }) => {
    const dispatch = useAppDispatch();
    const { t } = useLocalization();

    const [formData, setFormData] = useState({
        name: employee?.name || '',
        role: employee?.role || '',
        phone: employee?.phone || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (employee) {
            // Update
            dispatch({ type: 'UPDATE_EMPLOYEE', payload: { ...employee, ...formData } });
        } else {
            // Create
            const newEmployee: Employee = {
                id: `E${Date.now()}`,
                createdAt: new Date().toISOString(),
                ...formData,
                payments: [],
            };
            dispatch({ type: 'ADD_EMPLOYEE', payload: newEmployee });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label={t('employees.name')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
            />
            <Input
                label={t('employees.role')}
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g., Cutter, Stitcher"
                required
            />
            <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., 9123456789"
            />
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>
                    {t('form.cancel')}
                </Button>
                <Button type="submit">{t('form.save')}</Button>
            </div>
        </form>
    );
};