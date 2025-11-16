# Customize Server Default Names

## How to Change Default Category and Channel Names

When creating a new server, SoulVoyage automatically creates:
1. A default category (e.g., "TEXT CHANNELS")
2. A default channel (e.g., "general-chat")

You can customize these default names easily!

## Location

Open the file: **`src/utils/constants.ts`**

Look for the `SERVER_DEFAULTS` section:

```typescript
export const SERVER_DEFAULTS = {
  // ⚙️ CUSTOMIZE THESE DEFAULT NAMES:
  defaultCategory: {
    id: "cat_1",
    name: "TEXT CHANNELS", // 👈 Change this!
  },
  defaultChannel: {
    id: "general_1",
    name: "general-chat", // 👈 Change this!
    type: "text" as const,
    categoryId: "cat_1",
  },
  ...
} as const;
```

## Examples

### Example 1: Discord-style
```typescript
defaultCategory: {
  id: "cat_1",
  name: "TEXT CHANNELS",
},
defaultChannel: {
  id: "general_1",
  name: "general",
  type: "text" as const,
  categoryId: "cat_1",
},
```

### Example 2: Travel-themed
```typescript
defaultCategory: {
  id: "cat_1",
  name: "TRAVEL CHAT",
},
defaultChannel: {
  id: "general_1",
  name: "trip-planning",
  type: "text" as const,
  categoryId: "cat_1",
},
```

### Example 3: Community-themed
```typescript
defaultCategory: {
  id: "cat_1",
  name: "COMMUNITY",
},
defaultChannel: {
  id: "general_1",
  name: "welcome",
  type: "text" as const,
  categoryId: "cat_1",
},
```

### Example 4: Simple
```typescript
defaultCategory: {
  id: "cat_1",
  name: "Channels",
},
defaultChannel: {
  id: "general_1",
  name: "chat",
  type: "text" as const,
  categoryId: "cat_1",
},
```

## What This Affects

### For New Servers:
When someone creates a new server, it will automatically have:
- ✅ Your custom category name
- ✅ Your custom channel name

### For Existing Servers:
- ❌ Does NOT change existing servers
- ❌ Does NOT affect servers already in Firestore
- Only applies to **newly created** servers going forward

## Channel Naming Conventions

**Common patterns:**
- Discord style: `general`, `announcements`, `off-topic`
- Slack style: `#general`, `#random`, `#help`
- With hyphens: `general-chat`, `help-desk`, `off-topic`
- With underscores: `general_chat`, `help_desk`, `off_topic`

**Recommendations:**
- Keep it short (under 30 characters)
- Use lowercase (looks cleaner)
- Avoid spaces (use hyphens or underscores instead)
- Be descriptive but concise

## Category Naming Conventions

**Common patterns:**
- ALL CAPS: `TEXT CHANNELS`, `VOICE CHANNELS`
- Title Case: `Text Channels`, `Voice Channels`
- Simple: `Channels`, `Chat`, `Messages`
- Descriptive: `General Discussion`, `Community Chat`

**Recommendations:**
- Clear and descriptive
- ALL CAPS or Title Case (makes it stand out)
- Short and memorable

## Current Defaults

**Category name:** `TEXT CHANNELS`  
**Channel name:** `general-chat`

These are clean, professional defaults that work well for most use cases.

## Testing

After changing the defaults:

1. Build the project: `npm run build`
2. Create a new server
3. Check that it has your custom category and channel names

**Note:** You may need to clear your browser cache or use incognito mode to see the changes.

## Advanced: Multiple Default Channels

If you want new servers to have multiple default channels, you can modify the `handleCreateServer` function in `MainPage.tsx`:

```typescript
channels: [
  SERVER_DEFAULTS.defaultChannel,
  { id: "announcements_1", name: "announcements", type: "text", categoryId: "cat_1" },
  { id: "help_1", name: "help", type: "text", categoryId: "cat_1" },
],
```

## Troubleshooting

### Changes not showing up?
1. Make sure you saved the file
2. Rebuild: `npm run build`
3. Clear browser cache
4. Create a **new** server (not edit existing)

### Server creation fails?
1. Check console for errors
2. Make sure you didn't add special characters that might break things
3. Keep names under 50 characters

---

## Summary

**File to edit:** `src/utils/constants.ts`  
**What to change:** `defaultCategory.name` and `defaultChannel.name`  
**Applies to:** Newly created servers only  
**Build required:** Yes (`npm run build`)

Easy customization in one place! 🎉
