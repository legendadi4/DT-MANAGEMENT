
import React, { useState } from 'react';
import { useAppDispatch, useLocalization, useAppState } from '../../contexts/DataProvider';
import { Card, Input, Button, UserIcon } from '../ui';

export const LoginScreen: React.FC = () => {
    const dispatch = useAppDispatch();
    const { t } = useLocalization();
    const { shopInfo } = useAppState();
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Hardcoded credentials as requested
        if (username === 'Deepak@123' && password === '3344') {
            if (rememberMe) {
                window.localStorage.setItem('deepakTailorAuth', 'true');
            }
            dispatch({ type: 'LOGIN' });
        } else {
            setError(t('login.error'));
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-sm">
                 <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{shopInfo.name}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{shopInfo.tagline}</p>
                </div>
                <Card>
                    <div className="p-8">
                        <h2 className="text-xl font-semibold text-center text-slate-800 dark:text-slate-200 mb-6">{t('login.title')}</h2>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <Input 
                                label={t('login.username')}
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                             <Input 
                                label={t('login.password')}
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {error && <p className="text-sm text-red-500">{error}</p>}
                             <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input 
                                        id="remember-me" 
                                        name="remember-me" 
                                        type="checkbox" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-slate-700 dark:border-slate-600" 
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">{t('login.rememberMe')}</label>
                                </div>
                            </div>
                            <div>
                                <Button type="submit" className="w-full">
                                    <UserIcon className="w-5 h-5 mr-2" />
                                    {t('login.button')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    );
};