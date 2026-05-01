import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import AppLayout from '../components/AppLayout';

export default function AboutPage() {
  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-[70vh] text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
          <Info size={32} />
        </div>
        <h1 className="text-2xl font-display font-bold text-textPrimary mb-2">About Us</h1>
        <p className="text-textSecondary max-w-sm">
          My Things  is your smart assistant for managing product warranties, tracking expirations, and ensuring you never lose out on a claim again.
        </p>
      </motion.div>
    </AppLayout>
  );
}
