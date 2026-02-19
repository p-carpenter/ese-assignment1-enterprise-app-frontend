import { type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { type UserProfile } from '../types';
import styles from './ProfilePage.module.css';
import defaultAvatar from '../assets/default_avatar.png';

interface ProfilePageProps {
    profile: UserProfile | null;
}

export const ProfilePage = ({ profile }: ProfilePageProps): JSX.Element => {
    const navigate = useNavigate();

    if (!profile) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.error}>Profile not found</div>
                    <button className={styles.backButton} onClick={() => navigate('/')}>
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const username = profile.username;
    const avatarUrl = profile.avatar_url;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatar}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" />
                        ) : (
                            <img src={defaultAvatar} alt="Default Profile" />
                        )}
                    </div>
                    <h1 className={styles.displayName}>@{username}</h1>
                </div>

                <div className={styles.divider}></div>

                <div className={styles.infoSection}>
                    <div className={styles.infoLabel}>Email</div>
                    <div className={styles.infoValue}>{profile.email}</div>

                    <div className={styles.infoLabel}>User ID</div>
                    <div className={styles.infoValue}>#{profile.id}</div>
                </div>

                <button className={styles.backButton} onClick={() => navigate('/')}>
                    Back to Home
                </button>
            </div>
        </div>
    );
};
