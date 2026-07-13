import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function AppLayout({ sidebar, children }: AppLayoutProps) {
  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-lumi-bg">
      {/* Sidebar */}
      {sidebar}

      {/* Main Content Area */}
      <motion.main
        className="relative flex flex-1 flex-col overflow-hidden"
        layout
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.main>
    </div>
  );
}
