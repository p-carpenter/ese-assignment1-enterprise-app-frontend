import RegistrationForm from '../components/auth/RegistrationForm';

interface RegisterPageProps {
  onSuccess?: () => void;
}

const RegisterPage = ({ onSuccess }: RegisterPageProps) => {
  return (
    <>
      <div className="app-header">
        <h1 className="app-title">Music Player</h1>
      </div>
      <RegistrationForm onSuccess={onSuccess} />
    </>
  );
};

export default RegisterPage;
