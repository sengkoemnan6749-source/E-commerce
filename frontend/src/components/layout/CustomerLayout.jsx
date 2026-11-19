import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileMenu from './MobileMenu';
import CartDrawer from '../cart/CartDrawer';
import ToastContainer from '../common/Toast';
import SupportWidget from '../common/SupportWidget';

export default function CustomerLayout() {
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [focusMobileSearch, setFocusMobileSearch] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
    setFocusMobileSearch(false);
  }, [pathname]);

  const handleOpenMobileMenu = (focusSearch = false) => {
    setFocusMobileSearch(Boolean(focusSearch === true));
    setIsMobileMenuOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Pinned Glass Navbar */}
      <Navbar
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => {
          setFocusMobileSearch(false);
          setIsMobileMenuOpen((prev) => !prev);
        }}
        onOpenMobileMenu={handleOpenMobileMenu}
      />

      {/* Mobile & Tablet Slide-over Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        autoFocusSearch={focusMobileSearch}
        onClose={() => {
          setIsMobileMenuOpen(false);
          setFocusMobileSearch(false);
        }}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer />

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Storefront Hybrid Contact Support Pop-up */}
      <SupportWidget />
    </div>
  );
}
