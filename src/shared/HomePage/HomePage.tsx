import { type JSX } from "react";
import { SongLibrary } from "@/features/songs";

/**
 * Home page of the application.
 * Currently renders the `SongLibrary` component.
 * @returns The home page element.
 */
export const HomePage = (): JSX.Element => {
  return <SongLibrary />;
};
