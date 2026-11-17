import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Icon } from '../ui/Icon';

const ROUTE_TITLES = {
  '/': 'Financial Overview',
  '/transactions': 'Transactions & Ledger',
  '/accounts': 'Connected Accounts',
  '/budgets': 'Monthly Budgets',
  '/recurring': 'Recurring Commitments',
  '/goals': 'Savings Goals',
  '/reports': 'Financial Intelligence',
  '/settings': 'System Settings',
};

export function Topbar({ onOpenMobileNav }) {
  const location = useLocation();
  const { effectiveTheme, toggleTheme } = useTheme();
  const { user, userId, setUserId } = useAuth();
  const { currency } = useCurrency();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const title = ROUTE_TITLES[location.pathname] || 'FinPulse';

  // Close user dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isUserMenuOpen]);

  const handleSwitchUser = (newId) => {
    setUserId(newId);
    setIsUserMenuOpen(false);
  };

  return (
    <header className="topbar" aria-label="Top navigation">
      <div className="topbar-left">
        {/* Mobile menu button (<1024px) */}
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon-only hide-desktop"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <Icon name="Menu" size={18} />
        </button>

        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-right">
        {/* Currency Pill */}
        <span
          className="badge badge-neutral hide-mobile"
          title={`Active Currency: ${currency}`}
          style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
        >
          {currency}
        </span>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon-only"
          onClick={toggleTheme}
          aria-label={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <Icon name={effectiveTheme === 'dark' ? 'Sun' : 'Moon'} size={17} />
        </button>

        {/* User Switcher Dropdown */}
        <div className="user-dropdown-container" ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px' }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {user?.fullName ? user.fullName.charAt(0) : 'U'}
            </div>
            <span className="hide-mobile" style={{ fontSize: 'var(--font-xs)', fontWeight: 500 }}>
              {user?.fullName || 'User'}
            </span>
            <Icon name="ChevronDown" size={12} />
          </button>

          {isUserMenuOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                width: '220px',
                zIndex: 60,
                padding: 'var(--space-2)',
                boxShadow: 'var(--shadow-dropdown)',
              }}
              role="menu"
            >
              <div
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 'var(--font-xs)', color: 'var(--text-primary)' }}>
                  {user?.fullName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {user?.email}
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '4px 8px', fontWeight: 600 }}>
                SWITCH USER (SCOPE)
              </div>

              <button
                type="button"
                className={`btn btn-ghost btn-sm ${userId === 1 ? 'btn-secondary' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', height: '32px' }}
                onClick={() => handleSwitchUser(1)}
              >
                <span style={{ fontWeight: userId === 1 ? 600 : 400 }}>Aarav Sharma</span>
                {userId === 1 && <span style={{ marginLeft: 'auto', fontSize: '10px' }}>✓</span>}
              </button>

              <button
                type="button"
                className={`btn btn-ghost btn-sm ${userId === 2 ? 'btn-secondary' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', height: '32px' }}
                onClick={() => handleSwitchUser(2)}
              >
                <span style={{ fontWeight: userId === 2 ? 600 : 400 }}>Sarah Connor</span>
                {userId === 2 && <span style={{ marginLeft: 'auto', fontSize: '10px' }}>✓</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
