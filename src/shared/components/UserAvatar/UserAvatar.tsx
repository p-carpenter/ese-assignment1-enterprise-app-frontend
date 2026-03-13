import styles from "./UserAvatar.module.css";
import { type UserMini } from "@/features/auth/types";

export const UserAvatar = ({ user }: { user: UserMini }) => (
  <span className={styles.userAvatar} title={user.username}>
    {user.avatar_url ? (
      <img
        src={user.avatar_url}
        alt={user.username}
        className={styles.userAvatarImg}
      />
    ) : (
      <span className={styles.userAvatarFallback}>
        {user.username[0].toUpperCase()}
      </span>
    )}
  </span>
);
