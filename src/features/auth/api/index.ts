import { request } from "@/shared/api/client";
import type { UserProfile } from "../types";

/**
 * Log in with an email and password.
 * @param email User email.
 * @param password User password.
 */
export const login = async (email: string, password: string): Promise<void> => {
  await request("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

/**
 * Fetch the current user's profile.
 * @returns The user's profile.
 */
export const getMe = async (): Promise<UserProfile> => {
  return await request("/auth/user/");
};

/**
 * Log out the current user.
 */
export const logout = async (): Promise<void> => {
  await request("/auth/logout/", { method: "POST" });
};

/**
 * Register a new user.
 * @param username Desired username.
 * @param email User email.
 * @param password1 Password.
 * @param password2 Password confirmation.
 */
export const register = async (
  username: string,
  email: string,
  password1: string,
  password2: string,
): Promise<void> => {
  await request("/auth/registration/", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password1,
      password2,
    }),
  });
};

/**
 * Verify a registration email using the provided key.
 * @param key Verification key.
 */
export const verifyRegistrationEmail = async (
  key: string | undefined,
): Promise<void> => {
  await request(`/auth/registration/verify-email`, {
    method: "POST",
    body: JSON.stringify({
      key,
    }),
  });
};

/**
 * Request a password reset e-mail for the provided address.
 * @param email The user's e-mail address.
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  await request("/auth/password/reset/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

/**
 * Confirm a password reset using uid/token and new passwords.
 * @param uid User identifier part of reset link.
 * @param token Reset token.
 * @param new_password1 New password.
 * @param new_password2 Confirmation of new password.
 */
export const confirmPasswordReset = async (
  uid: string | undefined,
  token: string | undefined,
  new_password1: string,
  new_password2: string,
): Promise<void> => {
  await request("/auth/password/reset/confirm/", {
    method: "POST",
    body: JSON.stringify({
      uid,
      token,
      new_password1,
      new_password2,
    }),
  });
};

/**
 * Change the current user's password.
 * @param old_password Current password.
 * @param new_password1 New password.
 * @param new_password2 New password confirmation.
 */
export const changePassword = async (
  old_password: string,
  new_password1: string,
  new_password2: string,
): Promise<void> => {
  await request("/auth/password/change/", {
    method: "POST",
    body: JSON.stringify({
      old_password,
      new_password1,
      new_password2,
    }),
  });
};

/**
 * Update the current user's profile.
 * @param username New username.
 * @param avatar_url Optional avatar URL.
 * @returns The updated user profile.
 */
export const updateProfile = async (
  username: string,
  avatar_url?: string,
): Promise<UserProfile> => {
  return await request("/auth/user/", {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({
      username,
      avatar_url,
    }),
  });
};
