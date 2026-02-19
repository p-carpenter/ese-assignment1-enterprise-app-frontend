<!-- Copilot / AI agent instructions for this frontend repo -->
# Repository snapshot and AI guidance

This is a small React + TypeScript + Vite single-page frontend that talks to a local Django API and uploads media to Cloudinary. Keep suggestions concrete and tied to existing files.

- **Build / Dev:** use the scripts in `package.json`: `npm run dev` (vite), `npm run build` (tsc -b && vite build), `npm run preview`, `npm run lint`.
- **Backend:** frontend expects API at `http://127.0.0.1:8000/api` (see `src/services/api.ts`). Assume the Django backend is present and running when adding features that call `api`.
- **Cloudinary:** env vars `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_PRESET` are required for uploads (see `src/hooks/useCloudinaryUpload.tsx`).

## Big-picture architecture

- Single-page React app (Vite + TypeScript) located under `src/`.
- UI component area: `src/components/` — key files:
  - `src/components/MusicPlayer.tsx` — main player and library UI (audio loading, play/pause, playlist).
  - `src/components/SongForm.tsx` and `src/components/SongList.tsx` — upload form and list patterns (small, focused components).
- API surface: `src/services/api.ts` — centralized fetch helpers. Prefer adding API calls here rather than scattering `fetch` across components.
- Hooks: `src/hooks/` contains custom hooks, e.g. `useCloudinaryUpload.tsx` which returns `{ upload, isUploading, error }` and uploads audio/images to Cloudinary.
- Types: `src/types/index.ts` defines `Song`, `SongUploadPayload`, etc. Use these interfaces for props and API payloads.

## Important project-specific patterns

- Centralized API module: always use `api.getSongs()`, `api.createSong()` and `api.logPlay()` from `src/services/api.ts` for consistency and error handling.
- Upload flow: components should call `useCloudinaryUpload().upload(file)` to get `secure_url` and `duration` then call `api.createSong()` with a `SongUploadPayload` (see `src/types/index.ts`).
- Audio playback: the project uses `react-use-audio-player`. Look at `MusicPlayer.tsx` for the pattern: `load(url, { autoplay: true, html5: true, format: 'mp3' })` and `api.logPlay(song.id)` is fire-and-forget.
- Error handling: UI components typically catch and `console.error` API errors. If suggesting better handling, propose minimal, local changes (e.g., set an error state) rather than large architectural rewrites.
- Styling: components commonly use inline styles for quick layouts. Keep changes consistent with existing style approach unless creating a dedicated CSS/module.

## Environment and runnotes for the agent

- To run locally: ensure backend (Django) runs at `127.0.0.1:8000` and Cloudinary env vars are set, then:

```
npm install
npm run dev
```

- Linting: `npm run lint` (ESLint). Type-check is enforced during `npm run build` via `tsc -b`.

## Where to make typical changes

- New API endpoints: add to `src/services/api.ts` and update `src/types/index.ts` for payload/response types.
- New UI for uploads: reuse `useCloudinaryUpload.tsx` and call `api.createSong()` on success.
- Audio UX: `src/components/MusicPlayer.tsx` shows how to `load` and manage `isPlaying` state — follow this pattern for player controls.

## Examples to reference

- Fetch library: `api.getSongs()` used in `src/components/MusicPlayer.tsx` (see useEffect).
- Upload hook: `src/hooks/useCloudinaryUpload.tsx` detects audio via `file.type.startsWith('audio')` and posts to Cloudinary.
- Types: `Song` and `SongUploadPayload` in `src/types/index.ts`.

## Do not assume

- Do not assume a production Cloudinary or remote API — default `api` points to localhost. Recommend prompts to ask the maintainer if backend URLs or auth should be changed.

---
If any part of this is unclear or you'd like more targeted rules (PR message templates, branch naming, tests), tell me which area to expand and I'll iterate.
