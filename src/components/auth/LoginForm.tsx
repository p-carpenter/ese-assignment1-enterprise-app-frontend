import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import styles from './LoginForm.module.css';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.login(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Log in to Spotify</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        <input 
          placeholder="Email address" 
          className={styles.inputField}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          placeholder="Password" 
          type="password" 
          className={styles.inputField}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className={styles.submitButton} type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <div className={styles.divider}>
        <span>or</span>
      </div>
      <div className={styles.footer}>
        <span className={styles.footerText}>Don't have an account?</span>
        <Link to="/register" className={styles.footerLink}>Sign up for Spotify</Link>
      </div>
    </div>
  );
};

export default memo(LoginForm);