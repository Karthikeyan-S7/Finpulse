import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';

const BOTTOM_NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: 'Dashboard' },
  { path: '/transactions', label: 'Activity', icon: 'Transactions' },
  { path: '/budgets', label: 'Budgets', icon: 'Budgets' },
  { path: '/reports', label: 'Analytics', icon: 'Reports' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile bottom navigation">
      {BOTTOM_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon name={item.icon} size={20} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
