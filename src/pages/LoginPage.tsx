import LoginForm from "../components/features/auth/LoginForm";

interface LoginPageProps {
  onSuccess: () => void;
}

const LoginPage = ({ onSuccess }: LoginPageProps) => {
  return (
    <>
      <div className="app-header">
        <h1 className="app-title">Music Player</h1>
      </div>
      <LoginForm onSuccess={onSuccess} />
    </>
  );
};

export default LoginPage;
