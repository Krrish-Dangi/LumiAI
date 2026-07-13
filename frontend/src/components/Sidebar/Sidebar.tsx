import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelLeftOpen,
  PanelLeftClose,
  Plus,
  Search,
  User,
  LogOut,
  LogIn
} from 'lucide-react';
import SidebarItem from './SidebarItem';
import ConversationCard from '../Conversation/ConversationCard';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (conv: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  user: SupabaseUser | null;
  onLoginClick: () => void;
  onSignOut: () => void;
}

function Sidebar({
  isOpen,
  onToggle,
  onNewChat,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  user,
  onLoginClick,
  onSignOut
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onToggle}
        />
      )}
      
      <motion.aside
        animate={{ 
          width: isOpen ? 280 : 68,
          x: isOpen ? 0 : 0
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`h-full flex flex-col bg-lumi-bg-secondary border-r border-lumi-border overflow-hidden shrink-0 z-50
          ${isOpen ? 'absolute md:relative translate-x-0' : 'absolute md:relative -translate-x-full md:translate-x-0'}
          transition-transform duration-300 ease-in-out`}
      >
        {/* ═══ TOP BAR ═══ */}
        <div className="pt-4 px-3 shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            /* ─── Expanded: Glassmorphic island with New Chat + Collapse ─── */
            <motion.div
              key="expanded-top"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between gap-2
                         glass rounded-xl px-2 py-1.5"
            >
              {/* Left: + New Chat */}
              <motion.button
                onClick={onNewChat}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5
                           text-lumi-text-secondary hover:text-lumi-text
                           hover:bg-white/5 transition-colors duration-200"
              >
                <Plus size={18} className="text-lumi-violet shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">New Chat</span>
              </motion.button>

              {/* Right: Collapse button stuck to border */}
              <motion.button
                onClick={onToggle}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="flex items-center justify-center w-8 h-8 rounded-lg
                           text-lumi-text-muted hover:text-lumi-text
                           hover:bg-white/5 transition-colors duration-200"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={18} />
              </motion.button>
            </motion.div>
          ) : (
            /* ─── Collapsed: Just icon buttons vertically ─── */
            <motion.div
              key="collapsed-top"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-1"
            >
              <SidebarItem
                icon={<PanelLeftOpen size={20} />}
                label="Expand sidebar"
                onClick={onToggle}
              />
              <SidebarItem
                icon={<Plus size={20} />}
                label="New chat"
                onClick={onNewChat}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ EXPANDED CONTENT: Search + Conversations ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="expanded-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.25, delay: 0.1 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="flex flex-col flex-1 min-h-0 mt-4"
          >
            {/* Search input */}
            <div className="px-3 mb-3">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-lumi-text-muted z-10 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search conversations…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl
                    bg-white/[0.04] backdrop-blur-sm
                    border border-lumi-border
                    text-lumi-text placeholder:text-lumi-text-muted
                    outline-none
                    focus:border-lumi-violet/30 focus:bg-white/[0.06]
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                  <ConversationCard
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    onClick={() => onSelectConversation(conv)}
                    onDelete={onDeleteConversation}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-lumi-text-muted">
                  <Search size={20} className="mb-2 opacity-40" />
                  <p className="text-xs">
                    {searchQuery ? 'No results found' : 'No conversations yet'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BOTTOM: User Profile ═══ */}
      <div className="mt-auto shrink-0 border-t border-lumi-border relative group">
        <motion.div
          layout
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={`flex items-center py-3 ${
            isOpen ? 'px-4 gap-3' : 'justify-center px-0'
          }`}
        >
          {/* Avatar — always visible */}
          <motion.div
            layout="position"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              user
                ? 'bg-gradient-to-br from-lumi-violet to-lumi-magenta text-white overflow-hidden relative'
                : 'bg-lumi-bg border border-lumi-border text-lumi-text-muted overflow-hidden relative'
            }`}
          >
            {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
              <img 
                src={user.user_metadata.avatar_url || user.user_metadata.picture} 
                alt="Profile" 
                className="w-full h-full object-cover absolute inset-0 z-10 bg-transparent" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <User size={15} className="z-0" />
          </motion.div>

          {/* Name + Email — fades in/out smoothly */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="profile-info"
                initial={{ opacity: 0, width: 0 }}
                animate={{
                  opacity: 1,
                  width: 'auto',
                  transition: { opacity: { duration: 0.25, delay: 0.15 }, width: { duration: 0.3 } },
                }}
                exit={{
                  opacity: 0,
                  width: 0,
                  transition: { opacity: { duration: 0.1 }, width: { duration: 0.25, delay: 0.05 } },
                }}
                className="min-w-0 overflow-hidden flex-1"
              >
                <p className="text-sm font-medium text-lumi-text truncate">
                  {user ? (user.user_metadata?.name || 'Authenticated User') : 'Guest'}
                </p>
                <p className="text-xs text-lumi-text-muted truncate">
                  {user ? user.email : 'History clears on exit'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button (Login/Logout) */}
          <AnimatePresence>
            {isOpen && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                onClick={user ? onSignOut : onLoginClick}
                className="p-2 text-lumi-text-muted hover:text-lumi-text hover:bg-white/5 rounded-xl transition-colors"
                title={user ? 'Sign Out' : 'Sign In'}
              >
                {user ? <LogOut size={16} /> : <LogIn size={16} />}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.aside>
    </>
  );
}

export default Sidebar;
