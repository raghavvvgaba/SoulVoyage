# SoulVoyage - Development Guide

## 📦 Project Structure (Refactored)

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── ErrorBoundary.tsx
│   ├── LoadingSpinner.tsx
│   ├── Globe3D.tsx
│   └── ...
├── pages/              # Route pages
│   ├── MainPage.tsx    # Main messaging hub
│   ├── Explore.tsx     # Server discovery
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useFriends.ts   # Friend management logic
│   ├── useMessages.ts  # Message handling logic
│   ├── useServers.ts   # Server operations logic
│   └── use-toast.ts
├── services/           # Business logic & API calls
│   ├── firestoreService.ts  # Firestore operations
│   └── MapService.ts        # WebGL Earth service
├── types/              # TypeScript type definitions
│   ├── index.ts        # Shared types
│   └── webgl-earth.d.ts
├── utils/              # Utility functions
│   ├── constants.ts    # App constants
│   └── helpers.ts      # Helper functions
├── context/            # React context providers
│   └── AuthContext.tsx
└── lib/                # Third-party configs
    └── firebase.ts
```

## 🏗️ Architecture Improvements

### 1. **Separation of Concerns**
- **Pages**: Handle routing and layout only
- **Components**: Reusable UI elements
- **Hooks**: Encapsulate stateful logic
- **Services**: Handle external APIs (Firestore, WebSocket)
- **Utils**: Pure functions and constants

### 2. **Custom Hooks**
Created to extract complex logic from components:
- `useFriends()` - Friend requests and management
- `useMessages()` - Message sending, deletion, polls
- `useServers()` - Server CRUD operations

### 3. **Service Layer**
`firestoreService.ts` provides centralized Firestore operations:
- Friend operations (subscribe, send request, accept/reject)
- Message operations (send, delete, subscribe)
- Server operations (create, update, delete, subscribe)
- Poll voting

### 4. **Type Safety**
All shared types moved to `src/types/index.ts`:
- `Friend`, `FriendRequest`
- `Message`, `Poll`, `PollOption`
- `Server`, `Channel`, `Category`

### 5. **Error Handling**
- `ErrorBoundary` component wraps entire app
- Graceful error UI with retry options
- Console logging for debugging

### 6. **Performance Optimizations**
- Code splitting via Vite manual chunks
- Separate vendor bundles for React, Firebase, UI libs
- Reduced main bundle size from 999KB to ~238KB

## 🔧 Development Workflow

### Install Dependencies
```bash
npm install
cd server && npm install
```

### Run Development Server
```bash
npm run dev  # Runs both frontend and backend
```

This starts:
- Frontend: http://localhost:8080 (Vite)
- Backend: http://localhost:8080 (Express)
- WebSocket: ws://localhost:8081

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🧪 Code Quality

### Linting
```bash
npm run lint
```

### Type Checking
TypeScript is configured with relaxed settings for rapid development:
- `noImplicitAny: false`
- `strictNullChecks: false`

Consider enabling strict mode gradually for production.

## 📝 Best Practices

### 1. **Component Creation**
- Keep components under 300 lines
- Extract logic into custom hooks
- Use TypeScript interfaces for props

### 2. **State Management**
- Use custom hooks for complex state
- localStorage for persistence
- Firestore for real-time sync

### 3. **Error Handling**
- Wrap async operations in try-catch
- Show user-friendly toast messages
- Log errors for debugging

### 4. **Performance**
- Use React.memo for expensive components
- Debounce search inputs
- Lazy load heavy components

## 🔐 Environment Variables

Create `.env` file with:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🚀 Future Improvements

### High Priority
1. **Refactor MainPage.tsx** - Still 2122 lines, needs component extraction
2. **Add unit tests** - Jest + React Testing Library
3. **Enable TypeScript strict mode** - Gradually fix type issues
4. **Add E2E tests** - Playwright or Cypress

### Medium Priority
1. **Implement React Query** - Better caching for Firestore data
2. **Add loading skeletons** - Better UX during data fetching
3. **Optimize images** - Use WebP format, lazy loading
4. **Add service worker** - Offline support

### Low Priority
1. **Add Storybook** - Component documentation
2. **Implement analytics** - Track user behavior
3. **Add internationalization** - Multi-language support

## 📊 Bundle Analysis

After refactoring:
- `index.js`: 238KB (main app code)
- `firebase-vendor.js`: 472KB (Firebase SDK)
- `react-vendor.js`: 205KB (React libraries)
- `ui-vendor.js`: 86KB (Radix UI components)

**Total**: ~1MB (gzipped: ~271KB)

## 🐛 Common Issues

### WebSocket Connection Failed
- Ensure backend server is running: `cd server && npm run dev`
- Check if port 8081 is available

### Firestore Permission Denied
- Update Firestore rules in Firebase Console
- See `FIRESTORE_RULES.md` for latest rules

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear dist: `rm -rf dist`
- Rebuild: `npm run build`

## 📚 Resources

- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and test thoroughly
3. Commit with descriptive message
4. Push and create pull request

---

**Last Updated**: November 9, 2025
**Refactoring Status**: Phase 1 Complete ✅
