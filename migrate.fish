#!/usr/bin/env fish

# 1. create the new directory structure all at once
mkdir -p src/{app,features/auth/{components/{AuthFormFooter,LoginForm,RegistrationForm,RequestResetPasswordForm,ResetPasswordForm,ProtectedRoute},pages/{LoginPage,RegisterPage,RequestResetPasswordPage,ResetPasswordPage},api},features/songs/{components/{SongLibrary,SongList,SongForm,SongDetailsForm,EditSongModal,SongManagementDropdown},pages/{HomePage,UploadPage,ProfilePage},api},features/player/components/{MusicPlayer,PlaybackControls,ProgressBar,PlayHistory},shared/{components/{Button,Modal,FileSelect},layout/Header,icons,hooks,api,assets,types},styles}

# 2. move app/main
mv src/App.tsx src/app/
mv src/main.tsx src/app/

# 3. move auth feature
mv src/components/features/auth/AuthFormFooter.tsx src/features/auth/components/AuthFormFooter/
mv src/components/features/auth/LoginForm.tsx src/features/auth/components/LoginForm/
mv src/components/features/auth/RegistrationForm.tsx src/features/auth/components/RegistrationForm/
mv src/components/features/auth/RequestResetPasswordForm.tsx src/features/auth/components/RequestResetPasswordForm/
mv src/components/features/auth/ResetPasswordForm.tsx src/features/auth/components/ResetPasswordForm/
mv src/components/features/auth/ProtectedRoute.tsx src/features/auth/components/ProtectedRoute/

mv src/pages/LoginPage.tsx src/features/auth/pages/LoginPage/
mv src/components/features/auth/AuthPages.module.css src/features/auth/pages/LoginPage/
mv src/pages/RegisterPage.tsx src/features/auth/pages/RegisterPage/
mv src/pages/RequestResetPassword.tsx src/features/auth/pages/RequestResetPasswordPage/RequestResetPasswordPage.tsx
mv src/pages/ResetPassword.tsx src/features/auth/pages/ResetPasswordPage/ResetPasswordPage.tsx
mv src/tests/auth.test.tsx src/features/auth/

# 4. move songs feature
mv src/components/features/songs/SongLibrary.tsx src/features/songs/components/SongLibrary/
mv src/components/features/songs/SongList.module.css src/features/songs/components/SongList/
mv src/components/features/songs/SongForm.tsx src/features/songs/components/SongForm/
mv src/components/features/songs/SongForm.module.css src/features/songs/components/SongForm/
mv src/components/common/SongDetailsForm.tsx src/features/songs/components/SongDetailsForm/
mv src/components/features/songs/EditSongModal.tsx src/features/songs/components/EditSongModal/
mv src/components/features/songs/ManagementDropdown.tsx src/features/songs/components/SongManagementDropdown/SongManagementDropdown.tsx
mv src/components/features/songs/ManagementDropdown.module.css src/features/songs/components/SongManagementDropdown/

mv src/pages/HomePage.tsx src/features/songs/pages/HomePage/
mv src/pages/UploadPage.tsx src/features/songs/pages/UploadPage/
mv src/pages/ProfilePage.tsx src/features/songs/pages/ProfilePage/
mv src/pages/ProfilePage.module.css src/features/songs/pages/ProfilePage/
mv src/tests/songManagement.test.tsx src/features/songs/

# 5. move player feature
mv src/components/features/player/MusicPlayer.tsx src/features/player/components/MusicPlayer/
mv src/components/features/player/MusicPlayer.module.css src/features/player/components/MusicPlayer/
mv src/components/features/player/PlaybackControls.tsx src/features/player/components/PlaybackControls/
mv src/components/features/player/ProgressBar.tsx src/features/player/components/ProgressBar/
mv src/components/features/player/ProgressBar.module.css src/features/player/components/ProgressBar/
mv src/components/features/player/PlayHistory.tsx src/features/player/components/PlayHistory/
mv src/components/features/player/PlayHistory.module.css src/features/player/components/PlayHistory/
mv src/tests/player.test.tsx src/features/player/
mv src/tests/playHistory.test.tsx src/features/player/

# 6. move shared/global
mv src/components/layout/Button.tsx src/shared/components/Button/
mv src/components/layout/Button.module.css src/shared/components/Button/
mv src/components/common/Modal.tsx src/shared/components/Modal/
mv src/components/common/Modal.module.css src/shared/components/Modal/
mv src/components/common/FileSelect.tsx src/shared/components/FileSelect/
mv src/components/common/FileSelect.module.css src/shared/components/FileSelect/

mv src/components/layout/Header.tsx src/shared/layout/Header/
mv src/components/layout/Header.module.css src/shared/layout/Header/

mv src/components/icons/* src/shared/icons/
mv src/hooks/useCloudinaryUpload.tsx src/shared/hooks/useCloudinaryUpload.ts
mv src/services/api.ts src/shared/api/client.ts
mv src/assets/* src/shared/assets/
mv src/types/index.ts src/shared/types/

mv src/index.css src/styles/globals.css
mv src/App.css src/styles/variables.css

# clean up empty old directories
find src -type d -empty -delete
