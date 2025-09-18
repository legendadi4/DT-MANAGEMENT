
import React, { useState, useMemo } from 'react';
import { useAppState, useLocalization } from '../../contexts/DataProvider';
import type { Employee } from '../../types';
import { OrderStatus } from '../../types';
import { Button, Card, Modal } from '../ui';
import { EmployeeForm } from '../EmployeeForm';
import { Link } from 'react-router-dom';

export const EmployeesScreen: React.FC = () => {
    const { employees, orders } = useAppState();
    const { t } = useLocalization();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);

    const handleAddNew = () => {
        setSelectedEmployee(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEmployee(undefined);
    };

    const employeeWorkload = useMemo(() => {
        const workload: Record<string, number> = {};
        
        employees.forEach(emp => {
            workload[emp.id] = 0;
        });

        const activeOrders = orders.filter(o => 
            o.status === OrderStatus.InProgress
        );

        for (const order of activeOrders) {
            for (const item of order.items) {
                for (const assignment of item.assignments) {
                    if (assignment.employeeId && workload[assignment.employeeId] !== undefined) {
                        workload[assignment.employeeId]++;
                    }
                }
            }
        }
        return workload;
    }, [orders, employees]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('employees.title')}</h2>
                <Button onClick={handleAddNew}>{t('employees.newEmployee')}</Button>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('employees.name')}</th>
                                <th scope="col" className="px-6 py-3">{t('employees.role')}</th>
                                <th scope="col" className="px-6 py-3">Active Tasks</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Edit</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...employees].sort((a,b) => a.name.localeCompare(b.name)).map(employee => (
                                <tr key={employee.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        <Link to={`/employees/${employee.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400">{employee.name}</Link>
                                    </td>
                                    <td className="px-6 py-4">{employee.role}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-base">{employeeWorkload[employee.id] || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleEdit(employee)} 
                                            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedEmployee ? t('employees.editEmployee') : t('employees.newEmployee')}>
                <EmployeeForm employee={selectedEmployee} onClose={handleCloseModal} />
            </Modal>
        </div>
    );
};
