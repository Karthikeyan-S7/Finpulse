import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'Dashboard' },
  { path: '/transactions', label: 'Transactions', icon: 'Transactions' },
  { path: '/accounts', label: 'Accounts', icon: 'Accounts' },
  { path: '/budgets', label: 'Budgets', icon: 'Budgets' },
  { path: '/recurring', label: 'Recurring', icon: 'Recurring' },
  { path: '/goals', label: 'Goals', icon: 'Goals' },
  { path: '/reports', label: 'Reports', icon: 'Reports' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
];

export function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) {
  return (
    <aside
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`.trim()}
      aria-label="Sidebar navigation"
    >
      <div className="sidebar-header">
        <NavLink to="/" className="brand-logo" onClick={onCloseMobile}>
          <span className="brand-dot" aria-hidden="true" />
          {!isCollapsed && <span className="brand-name">FinPulse</span>}
        </NavLink>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon-only hide-desktop"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <Icon name="Close" size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              <Icon name={item.icon} size={18} />
            </span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer hide-mobile">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon-only"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ margin: isCollapsed ? '0 auto' : '0 0 0 auto' }}
        >
          <Icon name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={16} />
        </button>
      </div>
    </aside>
  );
}
