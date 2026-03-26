# Enterprise Audio Application Frontend

A modern, responsive, and accessible single-page application (SPA) built with React 19 and TypeScript. This frontend provides a comprehensive audio streaming and playlist management experience with robust form validation, global state caching, and advanced audio visualisation.

---

## Features

### 🎵 Advanced Audio Playback

- **Persistent Player**  
  Audio continues playing seamlessly across route navigations, managed by a global context provider.

- **Robust Audio Engine**  
  Reliable playback, seeking, and volume control facilitated by `react-use-audio-player`.

- **Synchronised Lyrics & History**  
  Interactive player expansion featuring playback history and synced lyric displays.

---

### 🔐 Authentication & Authorisation

- **Protected Routes**  
  Secure application shell that redirects unauthenticated users to the login screen.

- **Comprehensive Auth Flow**  
  Includes registration, login, email verification, and password reset workflows.

- **Profile Management**  
  Dedicated interfaces for users to view and edit their profiles securely.

---

### 🗂️ Content Management & Integrations

- **Intelligent Song Uploads**  
  Client-side ID3 tag parsing automatically extracts metadata (title, artist, album) from audio files to pre-fill upload forms.

- **Jamendo Integration**  
  Built-in search functionality to discover and import tracks directly from the Jamendo API.

- **Playlist Curation**  
  Create, manage, and view detailed playlists with drag-and-drop or modal-based track additions.

---

### ♿ Accessibility & UI

- **Accessible Components**  
  Built using `react-aria-components` to ensure strong screen reader support and keyboard navigation.

- **Type-Safe Forms**  
  Client-side validation using `react-hook-form` and `zod` for immediate, accessible feedback.

---

## Technology Stack

| Area | Technology |
|------|------------|
| Core Framework | React 19, TypeScript |
| Build Tool | Vite |
| Routing | React Router DOM |
| Data Fetching & State | TanStack React Query |
| Styling | CSS Modules (`.module.css`) |
| Forms & Validation | React Hook Form, Zod (`@hookform/resolvers`) |
| Audio Processing | `music-metadata` (Client-side ID3 parsing) |
| Testing | Vitest, React Testing Library, MSW, Jest DOM |
| Code Quality | ESLint, Prettier, TypeScript strict mode |

---

## Installation & Setup

### Prerequisites

- Node.js v18+
- npm

---

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ese-assignment1-enterprise-app-frontend
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_JAMENDO_CLIENT_ID=your_jamendo_client_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

---

### 4. Run the Development Server

```bash
npm run dev
```

Application will be available at:

```
http://127.0.0.1:5173
```

---

## Application Usage

Once authenticated, users can navigate the application via the persistent header and sidebar layout.

### Library Management

Users can:

- Upload local audio files with automatic metadata extraction
- Search the Jamendo catalogue and import public tracks
- Manage their personal audio library

---

### Playlists

Navigate to the **Playlists** section to create collections.

Tracks can be added via a playlist modal dialog or a dropdown menu on tracks in the library.

---

### Playback

Clicking a track starts playback in the persistent bottom player.

On mobile, expanding the player reveals:

- Synced lyrics
- Volume controls
- Playback progress controls
- Session play history

On desktop, the player does not expand. Synced lyrics can be viewed by clicking the song title from the library/playlist song list, where it will take you to a dedicated song details page. 

---

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Starts Vite development server |
| `npm run build` | Builds project for production |
| `npm run test` | Runs Vitest test suite with MSW |
| `npm run lint` | Runs ESLint |
| `npm run check-format` | Validates Prettier formatting |
| `npm run check-types` | Runs TypeScript compiler without emitting files |

---

## Architecture and Layering

The application follows **Feature-Sliced Design (FSD)** principles, separating domain logic from shared UI and utilities for long-term maintainability.

---

### Directory Structure

```
src/
├── App.tsx
├── features/
│   ├── auth/
│   ├── player/
│   ├── playlists/
│   └── songs/
│
├── mocks/
├── routes.tsx
│
├── shared/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   └── layout/
│
├── styles/
└── test/
```

---

## Routing Strategy

Routing is divided into two strict layers:

### Public Routes

Accessible without authentication:

```
/login
/register
/reset-password
```

Authenticated users are redirected away from these views.

---

### Protected Routes

Wrapped in:

```
<ProtectedRoute>
<AppLayout>
```

Ensures persistent mounting of:

- Sidebar
- Header
- Audio player

This prevents audio interruption during navigation.

---

## Key Technical Decisions

### 1. Direct-to-Cloud Uploads (`useCloudinaryUpload.ts`)

Uploading large audio files through the backend would create performance bottlenecks.

The custom hook:

```
useCloudinaryUpload
```

requests a signed upload signature from the Django backend, allowing files to be uploaded directly to Cloudinary from the browser.

---

### 2. Client-Side ID3 Parsing (`useId3Tags.ts`)

The `music-metadata` library reads binary file buffers locally.

Metadata extracted:

- Title
- Artist
- Album

These values automatically populate the React Hook Form fields, improving upload UX and reducing manual input.

---

### 3. Scoped Styling via CSS Modules

All styling uses:

```
*.module.css
```

Benefits:

- Prevents global namespace collisions
- Enables predictable styling behaviour
- Allows simple class names without conflicts

---

### 4. Server State Management with TanStack Query

TanStack Query replaces manual state & `useEffect` patterns.

Key benefits:

**Caching**

- Reduces redundant API calls
- Improves perceived performance

**Centralised Error Handling**

A global `MutationCache` intercepts errors.

If errors extend from:

```
ApiError
```

they are logged consistently without duplicating logic across components.

---

### 5. Form Validation & Type Safety

React Hook Form is paired with Zod schemas.

Benefits:

- Strong runtime validation
- Type-safe form structures
- Prevents invalid payloads reaching backend
- Eliminates duplicated validation logic

---

### 6. Persistent Audio Context Layering

```
<PlayerContext.Provider>
```

is mounted at the top of the React tree.

Result:

Audio playback continues uninterrupted across route changes.

Player state is fully decoupled from route state.

---

### 7. Comprehensive Testing Strategy

Testing stack:

- Vitest
- React Testing Library
- MSW (Mock Service Worker)

MSW intercepts network calls during tests, enabling reliable component isolation without a live backend.

Supporting utilities:

```
src/test/factories/
src/test/render.tsx
```

These ensure test environments consistently include:

- Router
- QueryClient
- AuthContext
- PlayerContext