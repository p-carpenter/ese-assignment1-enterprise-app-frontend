import { request } from "@/shared/api/client";
import type { UserProfile } from "../types";

export const login = async (email: string, password: string): Promise<void> => {
  await request("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const getMe = async (): Promise<UserProfile> => {
  return await request("/auth/user/");
};

export const logout = async (): Promise<void> => {
  await request("/auth/logout/", { method: "POST" });
};

export const register = async (
  username: string,
  email: string,
  password1: string,
  password2: string,
): Promise<void> => {
  await request("/auth/register/", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password1,
      password2,
    }),
  });
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  await request("/auth/password/reset/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

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
