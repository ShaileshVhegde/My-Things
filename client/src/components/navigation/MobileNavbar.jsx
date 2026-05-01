import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { House, BrainCircuit, Package, Plus, Info } from 'lucide-react';

export default function MobileNavbar() {
  const location = useLocation();

  const navItems = [
    { label: 'Home', icon: House, to: '/dashboard' },
    { label: 'Analyze', icon: BrainCircuit, to: '/analyze' },
    // Center button is handled separately
    { label: 'Products', icon: Package, to: '/products' },
    { label: 'About', icon: Info, to: '/about' },
  ];

  return (
    <div className="block md:hidden fixed bottom-0 left-0 w-full z-50">
      {/* Curved effect for center button can be simulated with absolute positioning */}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-bgSurface/90 backdrop-blur-lg border-t border-borderBase shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-2xl"></div>
      
      <div className="relative flex justify-between items-end h-20 px-6 pb-2 max-w-md mx-auto">
        {/* Left Items */}
        <div className="flex flex-1 justify-around items-center h-16">
          {navItems.slice(0, 2).map(({ label, icon: Icon, to }) => {
            const isActive = location.pathname === to;
            return (
              <Link key={to} to={to} className="flex flex-col items-center justify-center w-14">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-textSecondary hover:text-textPrimary'}`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary' : 'text-textMuted'}`}>
                  {label}
                </span>
                {isActive && (
                  <motion.div layoutId="mobile-nav-indicator" className="w-1 h-1 rounded-full bg-primary mt-1" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Center Floating Button */}
        <div className="relative flex justify-center w-20 shrink-0 z-10 h-full">
          <Link to="/products/add" className="absolute bottom-6 outline-none">
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.9, y: 0 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(108,71,255,0.6)] ${
                location.pathname === '/products/add' 
                  ? 'bg-gradient-to-tr from-primary to-accent' 
                  : 'bg-gradient-to-tr from-primary to-primaryHover'
              }`}
            >
              <Plus size={28} className="text-white" strokeWidth={2.5} />
            </motion.div>
          </Link>
        </div>

        {/* Right Items */}
        <div className="flex flex-1 justify-around items-center h-16">
          {navItems.slice(2, 4).map(({ label, icon: Icon, to }) => {
            const isActive = location.pathname === to;
            return (
              <Link key={to} to={to} className="flex flex-col items-center justify-center w-14">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-textSecondary hover:text-textPrimary'}`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary' : 'text-textMuted'}`}>
                  {label}
                </span>
                {isActive && (
                  <motion.div layoutId="mobile-nav-indicator" className="w-1 h-1 rounded-full bg-primary mt-1" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
