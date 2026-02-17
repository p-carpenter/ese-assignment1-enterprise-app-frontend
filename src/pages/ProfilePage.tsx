import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { type UserProfile } from '../types';
import styles from './ProfilePage.module.css';

export const ProfilePage = (): JSX.Element => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        api.getProfile()
            .then(data => setProfile(data))
            .catch(err => {
                console.error('Failed to load profile:', err);
                setError('Failed to load profile');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading profile...</div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.error}>{error || 'Profile not found'}</div>
                    <button className={styles.backButton} onClick={() => navigate('/')}>
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const displayName = profile.profile?.display_name || profile.username;
    const avatarUrl = profile.profile?.avatar_url;
    const userInitial = displayName

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatar}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" />
                        ) : (
                            userInitial
                        )}
                    </div>
                    <h1 className={styles.displayName}>{displayName}</h1>
                    <p className={styles.username}>@{profile.username}</p>
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
