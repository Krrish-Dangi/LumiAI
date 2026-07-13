import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from './components/Layout/AppLayout';
import Sidebar from './components/Sidebar/Sidebar';
import LumiLogo from './components/Logo/LumiLogo';
import MessageComposer from './components/Composer/MessageComposer';
import ChatContainer from './components/Chat/ChatContainer';
import AuthModal from './components/Auth/AuthModal';
import { useChatState } from './hooks/useChatState';
import { useAuth } from './hooks/useAuth';
import { getGreeting } from './utils';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const {
    conversations,
    activeConversation,
    messages,
    isLoading,
    isSidebarOpen,
    hasStartedChat,
    sendMessage,
    newChat,
    selectConversation,
    toggleSidebar,
    deleteConversation,
    loadConversations,
    messagesEndRef,
  } = useChatState();

  useEffect(() => {
    loadConversations();
  }, [user, loadConversations]);

  const greeting = getGreeting();

  const sidebar = (
    <Sidebar
      isOpen={isSidebarOpen}
      onToggle={toggleSidebar}
      onNewChat={newChat}
      conversations={conversations}
      activeConversationId={activeConversation?.id}
      onSelectConversation={(conv: any) => selectConversation(conv)}
      onDeleteConversation={deleteConversation}
      user={user}
      onLoginClick={() => setIsAuthModalOpen(true)}
      onSignOut={signOut}
    />
  );

  if (authLoading) {
    return (
      <div className="flex h-[100dvh] w-screen items-center justify-center bg-lumi-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lumi-violet"></div>
      </div>
    );
  }

  // Force AuthModal open if no user
  const requireAuth = !user;

  return (
    <AppLayout sidebar={sidebar}>
      <AuthModal 
        isOpen={requireAuth || isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        hideCloseButton={requireAuth} 
      />
      {/* ═══ STATE 1: Landing Screen ═══ */}
      <AnimatePresence mode="wait">
        {!hasStartedChat && (
          <motion.div
            key="landing"
            className="flex flex-1 flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Animated Logo */}
            <motion.div
              className="mb-8"
              exit={{
                y: -40,
                opacity: 0,
                scale: 0.9,
                transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
              }}
            >
              <LumiLogo size={180} />
            </motion.div>

            {/* Greeting */}
            <motion.div
              className="mb-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: -20,
                transition: { duration: 0.3 },
              }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className="mb-3 text-4xl font-semibold tracking-tight text-lumi-text">
                {greeting}, <span className="bg-gradient-to-r from-lumi-violet via-lumi-purple to-lumi-magenta bg-clip-text text-transparent">
                  {user ? (user.user_metadata?.name?.split(' ')[0] || 'Friend') : 'there'}
                </span>
              </h1>
              <p className="text-lg text-lumi-text-muted">
                How can I help you today?
              </p>
            </motion.div>

            {/* Centered Composer */}
            <motion.div
              className="w-full max-w-[680px]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: 20,
                transition: { duration: 0.3 },
              }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <MessageComposer
                onSend={sendMessage}
                isLoading={isLoading}
                isCentered={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ STATE 2: Conversation Screen ═══ */}
      <AnimatePresence>
        {hasStartedChat && (
          <motion.div
            key="conversation"
            className="flex flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              <ChatContainer
                messages={messages}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
              />
            </div>

            {/* Bottom Floating Composer */}
            <motion.div
              className="flex-shrink-0 px-6 pb-6 pt-2"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="mx-auto max-w-[680px]">
                <MessageComposer
                  onSend={sendMessage}
                  isLoading={isLoading}
                  isCentered={false}
                />
                <p className="mt-3 text-center text-xs text-lumi-text-muted/60">
                  Lumi can make mistakes. Consider checking important information.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
