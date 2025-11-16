/**
 * Application constants
 */

export const APP_CONFIG = {
  name: "SoulVoyage",
  description: "Connect with fellow solo travelers",
  version: "1.0.0",
} as const;

export const WEBSOCKET_CONFIG = {
  url: "ws://localhost:8081",
  reconnectAttempts: 5,
  reconnectDelay: 3000,
} as const;

export const STORAGE_KEYS = {
  currentProfileId: "currentProfileId",
  currentProfileName: "currentProfileName",
  userProfiles: "userProfiles",
  soulVoyageFriends: "soulVoyageFriends",
  soulVoyageServers: "soulVoyageServers",
  soulVoyageMessages: "soulVoyageMessages",
  defaultServersMigrated: "defaultServersMigrated",
} as const;

export const MESSAGE_TYPES = {
  text: "text",
  photo: "photo",
  poll: "poll",
} as const;

export const CHANNEL_TYPES = {
  text: "text",
  voice: "voice",
} as const;

export const SERVER_DEFAULTS = {
  // ⚙️ CUSTOMIZE THESE DEFAULT NAMES:
  defaultCategory: {
    id: "cat_1",
    name: "TEXT CHANNELS", // Change this to your preferred category name
  },
  defaultChannel: {
    id: "general_1",
    name: "general-chat", // Change this to your preferred channel name
    type: "text" as const,
    categoryId: "cat_1",
  },
  // Legacy channels (not used for new servers, kept for compatibility)
  defaultChannels: [
    { id: "1", name: "general", type: "text" as const, categoryId: "cat_1" },
    { id: "2", name: "announcements", type: "text" as const, categoryId: "cat_1" },
  ],
} as const;

export const VALIDATION = {
  maxMessageLength: 2000,
  maxServerNameLength: 50,
  maxChannelNameLength: 50,
  maxPollOptions: 10,
  minPollOptions: 2,
  maxPollTitleLength: 200,
  maxPollOptionLength: 100,
} as const;

export const UI_CONFIG = {
  messageLoadLimit: 50,
  friendRequestBadgeMax: 99,
  serverIconSize: 48,
  avatarSize: 40,
  toastDuration: 3000,
} as const;

export const ROUTES = {
  home: "/",
  login: "/login-auth",
  signup: "/signup-auth",
  main: "/main",
  editProfile: "/edit-profile",
  changeProfiles: "/change-profiles",
  friends: "/friends",
  explore: "/explore",
  serverSettings: (serverId: string) => `/server/${serverId}/settings`,
} as const;
