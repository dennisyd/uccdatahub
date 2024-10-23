import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      navigate('/hub');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store user data in localStorage
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
      localStorage.setItem('loginTime', new Date().toISOString());

      // Redirect to hub page
      navigate('/hub');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sign-in-container">
      <h2>Sign In</h2>
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
            disabled={isLoading}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
            disabled={isLoading}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>
        <button 
          type="submit" 
          className="sign-in-button"
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      <div className="register-link">
        Don't have an account? <button onClick={() => navigate('/')} className="link-button">Register</button>
      </div>

      <style jsx>{`
        .sign-in-container {
          max-width: 400px;
          margin: 2rem auto;
          padding: 2rem;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: #333;
          font-size: 1.8rem;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #555;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background-color: #fff;
        }

        .form-input:focus {
          border-color: #4a90e2;
          outline: none;
          box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
        }

        .form-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .form-input::placeholder {
          color: #aaa;
        }

        .sign-in-button {
          width: 100%;
          padding: 0.75rem;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .sign-in-button:hover:not(:disabled) {
          background-color: #357abd;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .sign-in-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }

        .sign-in-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
          transform: none;
        }

        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          text-align: center;
          font-size: 0.9rem;
          border: 1px solid rgba(198, 40, 40, 0.2);
        }

        .register-link {
          text-align: center;
          margin-top: 1.5rem;
          color: #666;
          font-size: 0.9rem;
        }

        .link-button {
          background: none;
          border: none;
          color: #4a90e2;
          cursor: pointer;
          font-size: inherit;
          padding: 0;
          text-decoration: underline;
          transition: color 0.3s ease;
        }

        .link-button:hover {
          color: #357abd;
        }

        @media (max-width: 480px) {
          .sign-in-container {
            margin: 1rem;
            padding: 1.5rem;
          }

          h2 {
            font-size: 1.6rem;
          }

          .form-input, .sign-in-button {
            padding: 0.6rem;
          }
        }
      `}</style>
    </div>
  );
}

export default SignIn;