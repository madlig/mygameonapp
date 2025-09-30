import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); //Destructure hook useAuth

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        await login(email, password); // Coba Login
        navigate('/dashboard'); // Jika berhasil, arahkan ke dashboard
    } catch (error) {
      // Tangani error login dari Firebase Auth
      let errorMessage = 'Failed to Log In, Please check your credentials';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false); // Hentikan Loading
    }
};

return (
    <div style= {{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
    }}>
        <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            width: '100%',
        }}>
           <h2 style={{textAlign: 'center', marginBottom: '1,5rem', color: '#333' }}>Login to Dashboard</h2>
           {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
                />
                <input
                    type="password"
                    placeholder='Password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
                />
                <button 
                    type="submit" 
                    disabled={loading} 
                    style={{ 
                        padding: '0.8rem', 
                        borderRadius: '4px', 
                        border: 'none', 
                        backgroundColor: '#007bff', 
                        color: '#fff', 
                        cursor: loading ? 'not-allowed' : 'pointer', 
                    }}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    </div>
    );
};

export default LoginPage;
