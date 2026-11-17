import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export function AppShell({ children }) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage('finpulse-sidebar-collapsed', false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const openMobile = () => {
    setIsMobileOpen(true);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="app-shell">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Desktop Sidebar & Mobile Slide-in Drawer */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={closeMobile}
      />

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="drawer-backdrop"
          style={{ display: 'block' }}
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Viewport */}
      <div className="viewport-container">
        <Topbar onOpenMobileNav={openMobile} />

        <main id="main-content" className="main-content" tabIndex={-1}>
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
