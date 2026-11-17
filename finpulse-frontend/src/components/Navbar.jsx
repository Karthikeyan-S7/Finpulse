import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './ui/Icon';

/**
 * Legacy Navbar (retained for backward compatibility, AppShell is active)
 */
export function Navbar() {
  return (
    <nav className="navbar" style={{ display: 'none' }}>
      <div className="nav-container">
        <NavLink to="/" className="nav-brand">
          <Icon name="Activity" size={24} />
          <span>FinPulse</span>
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
