import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      console.log('Attempting login with:', { email }); // Don't log password

      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Log the response details
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Try to get the response text first
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        // Try to parse the response as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (response.ok) {
        // Store user data in localStorage
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
        
        // Redirect to hub page
        navigate('/hub');
      } else {
        setErrorMessage(data.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An error occurred during login. Please try again.');
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
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #555;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-input:focus {
          border-color: #4a90e2;
          outline: none;
        }

        .form-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .sign-in-button {
          width: 100%;
          padding: 0.75rem;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .sign-in-button:hover:not(:disabled) {
          background-color: #357abd;
        }

        .sign-in-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          text-align: center;
        }

        .register-link {
          text-align: center;
          margin-top: 1.5rem;
          color: #666;
        }

        .link-button {
          background: none;
          border: none;
          color: #4a90e2;
          cursor: pointer;
          font-size: inherit;
          padding: 0;
          text-decoration: underline;
        }

        .link-button:hover {
          color: #357abd;
        }
      `}</style>
    </div>
  );
}

export default SignIn;