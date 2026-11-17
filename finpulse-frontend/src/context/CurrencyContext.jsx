import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext(null);

const DEFAULT_CURRENCY = 'INR';
const DEFAULT_LOCALE = 'en-IN';

export function CurrencyProvider({ children }) {
  const { user, updateProfile } = useAuth();

  const currency = user?.currency || DEFAULT_CURRENCY;
  const locale = user?.locale || DEFAULT_LOCALE;

  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }, [locale, currency]);

  const compactFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 1,
      });
    } catch {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        notation: 'compact',
        maximumFractionDigits: 1,
      });
    }
  }, [locale, currency]);

  const format = (amount, options = {}) => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return formatter.format(0);
    }
    const num = Number(amount);
    if (options.compact) {
      return compactFormatter.format(num);
    }
    if (options.sign) {
      const formatted = formatter.format(Math.abs(num));
      return num > 0 ? `+${formatted}` : num < 0 ? `-${formatted}` : formatted;
    }
    return formatter.format(num);
  };

  const formatCompact = (amount) => format(amount, { compact: true });

  const getCurrencySymbol = (curr = currency, loc = locale) => {
    try {
      const parts = new Intl.NumberFormat(loc, { style: 'currency', currency: curr }).formatToParts(0);
      const symbolPart = parts.find((p) => p.type === 'currency');
      return symbolPart ? symbolPart.value : (curr === 'INR' ? '₹' : curr);
    } catch {
      const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
      return symbols[curr] || (curr === 'INR' ? '₹' : curr);
    }
  };

  const setCurrency = async (newCurrency) => {
    if (user?.id) {
      await updateProfile({
        fullName: user.fullName,
        email: user.email,
        currency: newCurrency,
        locale: user.locale || DEFAULT_LOCALE,
      });
    }
  };

  const setLocale = async (newLocale) => {
    if (user?.id) {
      await updateProfile({
        fullName: user.fullName,
        email: user.email,
        currency: user.currency || DEFAULT_CURRENCY,
        locale: newLocale,
      });
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        locale,
        format,
        formatAmount: format, // backward compatibility
        formatCompact,
        getCurrencySymbol,
        setCurrency,
        setLocale,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
