// Simple console utility to reduce spam
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

// Track recent messages to avoid duplicates
const recentMessages = new Set();
const MAX_MESSAGES = 100;
const CLEANUP_INTERVAL = 30000; // 30 seconds

let messageCount = 0;
let lastCleanup = Date.now();

function shouldLog(message: string): boolean {
  const now = Date.now();

  // Cleanup old messages periodically
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    recentMessages.clear();
    messageCount = 0;
    lastCleanup = now;
  }

  // Skip if we've logged too many messages
  if (messageCount > MAX_MESSAGES) {
    return false;
  }

  // Skip duplicate messages
  const messageKey = message.toString();
  if (recentMessages.has(messageKey)) {
    return false;
  }

  recentMessages.add(messageKey);
  messageCount++;
  return true;
}

// Override console methods with filtering
console.log = function(...args: any[]) {
  if (shouldLog(args[0] || '')) {
    originalLog.apply(console, args);
  }
};

console.warn = function(...args: any[]) {
  if (shouldLog(args[0] || '')) {
    originalWarn.apply(console, args);
  }
};

console.error = function(...args: any[]) {
  // Always allow errors through
  originalError.apply(console, args);
};

export {};