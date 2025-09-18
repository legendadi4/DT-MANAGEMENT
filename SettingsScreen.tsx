
import React, { useRef, useState, useEffect } from 'react';
import { useLocalization, useAppState, useAppDispatch } from '../../contexts/DataProvider';
import { Language, AppState, ShopInfo } from '../../types';
import { Card, Select, Button, DownloadIcon, UploadIcon, Input, Textarea } from '../ui';

export const SettingsScreen: React.FC = () => {
  const { t, language, setLanguage, theme, setTheme } = useLocalization();
  const state = useAppState();
  const dispatch = useAppDispatch();
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const { shopInfo } = state;
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [shopInfoForm, setShopInfoForm] = useState<ShopInfo>(shopInfo);

  useEffect(() => {
    setShopInfoForm(shopInfo);
  }, [shopInfo]);

  const handleShopInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShopInfoForm({ ...shopInfoForm, [e.target.name]: e.target.value });
  };
  
  const handleSaveShopInfo = () => {
    dispatch({ type: 'UPDATE_SHOP_INFO', payload: shopInfoForm });
    setIsEditingInfo(false);
  };
  
  const handleCancelEdit = () => {
    setShopInfoForm(shopInfo);
    setIsEditingInfo(false);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };
  
  const handleExport = () => {
    const dataToExport: Omit<AppState, 'language' | 'theme' | 'isAuthenticated'> = {
      customers: state.customers,
      measurements: state.measurements,
      orders: state.orders,
      garmentTypes: state.garmentTypes,
      employees: state.employees,
      shopInfo: state.shopInfo,
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.download = `deepak-tailor-backup-${today}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Are you sure? Importing a backup will overwrite all current data.")) {
      event.target.value = ''; // Reset file input
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File content is not text");
        const importedData = JSON.parse(text);

        if (importedData.customers && importedData.orders && importedData.measurements && importedData.garmentTypes) {
          dispatch({ type: 'RESTORE_STATE', payload: importedData });
          alert("Data restored successfully!");
        } else {
          alert("Invalid backup file format. Missing required data.");
        }
      } catch (error) {
        console.error("Error parsing backup file:", error);
        alert("Failed to import backup file. It might be corrupted or in the wrong format.");
      } finally {
        if(importFileInputRef.current) {
            importFileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };
  
  const handleLogout = () => {
    if (window.confirm(t('settings.logout.confirm'))) {
        window.localStorage.removeItem('deepakTailorAuth');
        dispatch({ type: 'LOGOUT' });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('settings.title')}</h2>
      
      <Card>
        <div className="p-6">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Preferences</h3>
            <div className="mt-4 space-y-6">
                <div>
                    <Select
                        label={t('settings.language')}
                        id="language"
                        value={language}
                        onChange={handleLanguageChange}
                    >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                        <option value="mr">मराठी (Marathi)</option>
                    </Select>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('settings.theme')}</span>
                   <div className="flex items-center gap-4">
                        <button onClick={() => setTheme('light')} className={`px-4 py-2 text-sm rounded-lg ${theme === 'light' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            {t('settings.theme.light')}
                        </button>
                        <button onClick={() => setTheme('dark')} className={`px-4 py-2 text-sm rounded-lg ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            {t('settings.theme.dark')}
                        </button>
                   </div>
                </div>
            </div>
        </div>
      </Card>
      
      <Card>
        <div className="p-6">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Backup & Restore</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Save your data to a file for backup, or restore from a previous backup.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <Button onClick={handleExport} variant="secondary">
                    <DownloadIcon className="w-4 h-4 mr-2"/>
                    Export All Data
                </Button>
                <Button onClick={handleImportClick} variant="secondary">
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Import from Backup
                </Button>
                <input
                    type="file"
                    ref={importFileInputRef}
                    className="hidden"
                    accept=".json,application/json"
                    onChange={handleImportFileChange}
                />
            </div>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                <strong>Warning:</strong> Importing will overwrite all existing data in the app.
            </p>
        </div>
      </Card>

      <Card>
        <div className="p-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Shop Information</h3>
                {!isEditingInfo && (
                    <Button variant="secondary" onClick={() => setIsEditingInfo(true)}>Edit</Button>
                )}
            </div>
            
            {isEditingInfo ? (
                <form onSubmit={e => { e.preventDefault(); handleSaveShopInfo(); }} className="mt-4 space-y-4">
                    <Input label="Shop Name" name="name" value={shopInfoForm.name} onChange={handleShopInfoChange} required />
                    <Input label="Tagline" name="tagline" value={shopInfoForm.tagline} onChange={handleShopInfoChange} />
                    <Textarea label="Address" name="address" value={shopInfoForm.address} onChange={handleShopInfoChange} rows={3} required/>
                    <Input label="Phone Number" name="phone" type="tel" value={shopInfoForm.phone} onChange={handleShopInfoChange} required/>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            ) : (
                <>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        These details appear on your invoices and app header.
                    </p>
                    <div className="mt-4 text-sm space-y-2">
                        <p><strong>Name:</strong> {shopInfo.name}</p>
                        <p><strong>Tagline:</strong> {shopInfo.tagline}</p>
                        <p><strong>Address:</strong> {shopInfo.address}</p>
                        <p><strong>Phone:</strong> {shopInfo.phone}</p>
                    </div>
                </>
            )}
        </div>
      </Card>
      
      <Card>
        <div className="p-6">
             <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Account</h3>
             <div className="mt-4">
                <Button onClick={handleLogout} variant="danger">{t('settings.logout')}</Button>
             </div>
        </div>
      </Card>

    </div>
  );
};