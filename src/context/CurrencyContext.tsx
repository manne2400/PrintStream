import React, { createContext, useContext, useState, useEffect } from 'react';
import initializeDatabase from '../database/setup';
import { SettingsOperations } from '../database/operations';

interface CurrencyContextType {
  currency: string;
  updateCurrency: (newCurrency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState('DKK');

  useEffect(() => {
    const loadCurrency = async () => {
      const db = await initializeDatabase();
      const ops = new SettingsOperations(db);
      const currentCurrency = await ops.getCurrency();
      setCurrency(currentCurrency);
    };
    loadCurrency();
  }, []);

  const updateCurrency = async (newCurrency: string) => {
    const db = await initializeDatabase();
    const ops = new SettingsOperations(db);
    await ops.updateSettings({ currency: newCurrency });
    setCurrency(newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, updateCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}; 