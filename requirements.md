Functional requirements:
- Play songs added into the database
- Create playlists
- Create account and log in. Authentication required to use application. SendGrid for confirmation email?
- Add songs/MP3s by uploading them - use media hosting site to serve content e.g. Cloudinary. Create agnostic FileUpload code 
- Profile avatar? Use third-party to serve (see above).
- Token-based authentication (JWT tokens)
- Delete songs and playlists.
- Deploy site with Render or other free deployment platform. 
- Password reset functionality (using SendGrid for email)
- Account edit page (initiate Password reset, edit profile avatar for example)
- Pagination of songs to support scalability (server-side pagination).
- Search and sort (sort by Artist, Duration, Date Added)
- Audit trail: play history (Log every time a user plays a song. (Timestamp, UserID, SongID))
Not in scope:
- Admin dashboard/admin role. Users are admins of their own music and can CRUD.

Non-functional requirements:
- Three-layer architecture - TS React frontend, Django (Python) middleware, PostGreSQL backend DB
- Modular and maintainable API design
- Secure authentication, protected endpoints (cannot access main site without login)
- Modular frontend design (Separation of concerns, components)
- Server-side validation 
- Basic scalability consideration

BDD will help me test behavioural flow. 
TDD ensures I stick to the functional requirements.
ts-audio library simplifies music control.

NOTES FOR THINGS TO FIX:
- Lyrics seem to get refetched when the song is updated; cache it with RQ?
- SongList, PlaylistList not updating/refetching when new song/playlist added.
- Volume control doesn't work.
- PlayHistory does not show song details
- Add 'Resend Email Verification' option when registering to avoid issues w/ emails
- {"non_field_errors":["E-mail is not verified."]} - Turn these into human-readable errors. Centralised error handling service?
- Public routes styling needs to reflect new glass/acrylic styling of application.
- Song upload form needs improved styling. Especially file select - add to globals.css?
- Create New Playlist modal needs to display over main layout, not over PlaylistsList sidebar only.
- Add visible UI error messages for: unable to manage song in library (perm error)
- Playlist title moves on details page depending on content below it. Make the placement consistent. Maybe move contributors stack next to
owner & song count.
- An empty string ("") was passed to the src attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to src instead of an empty string.

