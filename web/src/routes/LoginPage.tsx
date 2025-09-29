import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../api/client';
import { useAuth } from '../context/AuthProvider';
import { Button } from '../components/Button';

export default function LoginPage() {
  const { user } = useAuth();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          👑 Tool Tracker
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          {user ? `Signed in as ${user.email}` : 'Sign in to continue'}
        </p>
        {!user ? (
          <Button onClick={handleLogin} className="w-full justify-center">
            Sign in with Google
          </Button>
        ) : (
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="w-full justify-center"
          >
            Log Out
          </Button>
        )}
      </div>
    </div>
  );
}
