# Enterprise Audio Application Frontend

A modern, responsive, and accessible single-page application (SPA) built with React 19 and TypeScript. This frontend provides a comprehensive audio streaming and playlist management experience with robust form validation, global state caching, and advanced audio visualisation.

## Features

## 🎵 Advanced Audio Playback

- **Persistent Player**: Audio continues playing seamlessly across route navigations, managed by a global context provider.
    
- **Robust Audio Engine**: Reliable playback, seeking, and volume control facilitated by `react-use-audio-player`.

## 🔐 Authentication & Authorisation
- **Protected Routes**: Secure application shell that redirects unauthenticated users to the login screen.
    
- **Comprehensive Auth Flow**: Includes registration, login, email verification, and password reset workflows.
    
- **Profile Management**: Dedicated interfaces for users to view and edit their profiles.

## 🗂️ Content Management
- **Song Uploads**: Interactive upload forms with strict schema validation.
    
- **Playlist Curation**: Create, manage, and view detailed playlists.
    
- **Song Details**: Dedicated pages for viewing metadata and interacting with individual tracks.

## ♿ Accessibility & UI

- **Accessible Components**: Built utilizing `react-aria-components` to ensure robust screen reader support and keyboard navigation.
    
- **Type-Safe Forms**: Client-side validation using `react-hook-form` and `zod` for immediate, accessible user feedback.
## Technology Stack

- **Core Framework**: React 19, TypeScript
    
- **Build Tool**: Vite
    
- **Routing**: React Router DOM 
    
- **Data Fetching & State**: TanStack React Query
    
- **Forms & Validation**: React Hook Form, Zod (@hookform/resolvers)
    
- **Audio Processing**: music-metadata

- **Testing**: Vitest, React Testing Library, Mock Service Worker (MSW), Jest DOM
    
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
## Installation & Setup

## Prerequisites

- Node.js
    
- npm (Node Package Manager
## Setup Instructions

1. **Clone the repository**
    
    Bash
    
    ```
    git clone <repository-url>
    cd ese-assignment1-enterprise-app-frontend
    ```
    
1. **Install dependencies**
    ```
    npm install
    ```
    
2. **Run the development server**
    ```
    npm run dev
    ```
    
    The application will be available at `http://127.0.0.1:5173`.

## Available Scripts

- `npm run dev`: Starts the Vite development server.
    
- `npm run build`: Compiles TypeScript and builds the project for production.
    
- `npm run test`: Runs the Vitest test suite with coverage reporting enabled.
    
- `npm run lint`: Runs ESLint to identify code issues.
    
- `npm run check-format`: Verifies formatting using Prettier.
    
- `npm run check-types`: Runs the TypeScript compiler without emitting files to check for type errors.
    
## Architecture and Layering
The application strictly adheres to a **Feature-Sliced Architecture**, separating domain-specific logic from reusable shared components to ensure high maintainability and scalability.

## Directory Structure
```
src/
├── app/                    # Application-level configurations and setups
├── App.css                 # Global application styling
├── App.tsx                 # Root application component
├── features/               # Domain-specific modules (Feature-Sliced Design)
│   ├── auth/               # Authentication, registration, and profile management
│   │   ├── api/            # Auth-specific API endpoints and queries
│   │   ├── components/     # Auth UI components (e.g., login and registration forms)
│   │   └── pages/          # Auth-related page views
│   ├── player/             # Persistent audio player state and controls
│   │   ├── api/            # Player-related API interactions
│   │   ├── components/     # Player UI (controls, waveforms, volume bars, lyrics)
│   │   └── hooks/          # Audio playback and lyric syncing hooks
│   ├── playlists/          # Playlist curation and management
│   │   ├── api/            # Playlist API queries and mutations
│   │   ├── components/     # Playlist UI (cards, lists, modals for adding songs)
│   │   └── pages/          # Playlist detail and list views
│   └── songs/              # Song catalog, uploading, and metadata
│       ├── api/            # Song fetching logic (including third-party like Jamendo)
│       ├── components/     # Song rows, upload forms, and search inputs
│       ├── hooks/          # Custom hooks for parsing song data (e.g., ID3 tags)
│       └── pages/          # Song library and individual song detail pages
├── main.tsx                # Application entry point, global providers, QueryClient setup
├── mocks/                  # Mock Service Worker (MSW) handlers for local API mocking
├── routes.tsx              # React Router configuration and route protection logic
├── shared/                 # Reusable, domain-agnostic resources
│   ├── api/                # Base API client and custom error handling classes
│   ├── assets/             # Static assets (images, default avatars, global SVGs)
│   ├── components/         # Generic UI components (Buttons, Modals, Inputs, Alerts)
│   ├── context/            # Global contexts (e.g., AuthContext, PlayerContext)
│   ├── hooks/              # Shared utility hooks (e.g., useMediaQuery, useCloudinaryUpload)
│   ├── icons/              # SVG icon components used across the app
│   ├── layout/             # Application shell components (Sidebar, Header, Layout wrappers)
│   ├── lib/                # Shared utilities and constants (e.g., React Query keys)
│   └── types/              # Global TypeScript interfaces
├── styles/                 # Global CSS variables and base styling rules
└── test/                   # Test setup, rendering utilities, and environment config
    └── factories/          # Data factories for generating mock objects in tests
```

## Routing Strategy
The routing tree (defined in `routes.tsx`) is divided into two layers:

1. **Public/Auth Routes**: Pages like `/login` and `/register` are exposed without the main application layout. If an authenticated user attempts to access these, they are immediately redirected to the home page.
    
2. **Protected Routes**: Wrapped in a `<ProtectedRoute>` component and an `<AppLayout>` shell. This ensures that the sidebar, header, and persistent audio player are only mounted - and remain mounted - while navigating authenticated sections of the app.

## Key Technical Decisions
### 1. Server State Management with TanStack Query

Rather than relying on `useEffect` and standard React state for API interactions, the application uses **TanStack React Query**.

- **Caching & Stale Time**: Data is cached aggressively (`staleTime: Infinity` configured globally in `main.tsx`) to minimise redundant network requests.
    
- **Centralised Error Handling**: A global `MutationCache` is configured at the application root (`main.tsx`). It intercepts all mutation errors, checks if they are instances of a custom `ApiError` class, and logs a readable message. This prevents the need to rewrite error-handling boilerplate in every form component.
    
### 2. Form Validation & Type Safety
The application pairs **React Hook Form** with **Zod**.
- Zod schemas define the exact shape and requirements of form data (e.g., song uploads, registration).
- React Hook Form uses the `@hookform/resolvers` adapter to parse data against the Zod schema before submission. This guarantees that the data sent to the backend perfectly matches the TypeScript interfaces, catching validation errors entirely on the client side without rendering penalties.

### 3. Persistent Audio Context Layering
To ensure audio doesn't stop playing when a user navigates from the homepage to a user profile, the audio providers (`<AudioPlayerProvider>` and the custom `<PlayerProvider>`) are injected at the very top of the React tree in `main.tsx`, wrapping the `<App />` router. This decoupling of the player state from the route state allows continuous background playback.

### 4. Comprehensive Testing Strategy
The project relies on **Vitest** (which provides a Jest-compatible API but runs much faster via Vite) and **React Testing Library**.
- **MSW (Mock Service Worker)** is utilised to intercept network requests during tests, allowing developers to test components in isolation without relying on a live backend.
- The configuration (`vite.config.ts`) runs tests in a `jsdom` environment and enforces coverage reporting for continuous integration checks.
- Factory functions located in `src/test/factories/` enable consistent mock data. The custom render function in `src/test/render.tsx`  ensures components are wrapped in the necessary providers (Router, QueryClient, AuthContext).

## Environment Variables
Create a `.env` file in the root directory and configure the following variables:
```
VITE_JAMENDO_CLIENT_ID=jamendo_client_id # your free Jamendo client ID for Jamendo song integration
VITE_API_BASE_URL=http://localhost:8000/api  # Your backend API URL
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name   # Cloudinary integration for uploads
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
```