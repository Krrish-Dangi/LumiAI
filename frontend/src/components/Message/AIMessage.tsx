import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatTimestamp } from '../../utils';

interface AIMessageProps {
  message: {
    id: string;
    content: string;
    timestamp: Date;
  };
  isLoading?: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2 mt-1">
      <div className="glass rounded-2xl px-4 py-2.5 shadow-sm border border-lumi-border/40 flex items-center gap-1.5 backdrop-blur-md bg-white/[0.02]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-lumi-text-muted"
            animate={{
              y: [0, -3, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}

import LumiLogo from '../Logo/LumiLogo';

function AIMessage({ message, isLoading = false }: AIMessageProps) {
  // Only apply typewriter effect to NEW messages (less than 2 seconds old when mounted)
  // and only if they are not the loading placeholder.
  const isNew = useMemo(() => {
    if (isLoading || message.id === '__loading__') return false;
    const age = Date.now() - new Date(message.timestamp).getTime();
    return age < 2000;
  }, [message.id, message.timestamp, isLoading]);

  const [displayedContent, setDisplayedContent] = useState(isNew ? '' : message.content);

  useEffect(() => {
    if (!isNew) {
      setDisplayedContent(message.content);
      return;
    }

    let currentIndex = displayedContent.length;
    const targetContent = message.content;
    const totalLength = targetContent.length;

    if (currentIndex >= totalLength) return;

    // Type the whole message in ~1.5 seconds max, or faster for short messages
    const durationMs = Math.min(1500, totalLength * 20);
    const charsPerTick = Math.max(1, Math.ceil(totalLength / (durationMs / 16)));

    const interval = setInterval(() => {
      currentIndex += charsPerTick;
      if (currentIndex >= totalLength) {
        setDisplayedContent(targetContent);
        clearInterval(interval);
      } else {
        setDisplayedContent(targetContent.slice(0, currentIndex));
      }
    }, 16);

    return () => clearInterval(interval);
  }, [message.content, isNew]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex justify-start"
    >
      <div className="max-w-[680px]">
        {/* Avatar + Content */}
        <div className="flex items-start gap-3">
          {/* Lumi avatar */}
          <div className="flex shrink-0 items-center justify-center mt-0.5">
            <LumiLogo size={28} />
          </div>

          {/* Message body */}
          <div className="min-w-0 pt-0.5">
            {isLoading ? (
              <TypingIndicator />
            ) : (
              <div className="ai-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayedContent}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <p className="mt-1.5 pl-10 text-xs text-lumi-text-muted">
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

export default AIMessage;
