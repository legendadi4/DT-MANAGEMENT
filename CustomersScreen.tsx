
import React, { useState } from 'react';
import { useAppState, useLocalization } from '../../contexts/DataProvider';
import type { Customer } from '../../types';
import { Button, Card, Modal } from '../ui';
import { CustomerForm } from '../CustomerForm';
import { Link } from 'react-router-dom';

export const CustomersScreen: React.FC = () => {
    const { customers } = useAppState();
    const { t } = useLocalization();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);

    const handleAddNew = () => {
        setSelectedCustomer(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCustomer(undefined);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('customers.title')}</h2>
                <Button onClick={handleAddNew}>{t('customers.newCustomer')}</Button>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('customers.name')}</th>
                                <th scope="col" className="px-6 py-3">{t('customers.phone')}</th>
                                <th scope="col" className="px-6 py-3 hidden md:table-cell">{t('customers.address')}</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Edit</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...customers].sort((a,b) => a.fullName.localeCompare(b.fullName)).map(customer => (
                                <tr key={customer.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        <Link to={`/customers/${customer.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400">
                                            {customer.fullName}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">{customer.phone}</td>
                                    <td className="px-6 py-4 hidden md:table-cell">{customer.address}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEdit(customer)} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedCustomer ? 'Edit Customer' : t('customers.newCustomer')} size="lg">
                <CustomerForm customer={selectedCustomer} onClose={handleCloseModal} />
            </Modal>
        </div>
    );
};
