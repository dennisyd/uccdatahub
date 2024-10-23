import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Basic form validation
    if (!formData.firstName || !formData.lastName || !formData.businessName || !formData.email || !formData.password || !formData.confirmPassword) {
      setErrorMessage('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          businessName: formData.businessName,
          email: formData.email,
          password: formData.password
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('Registration successful! You can now log in.');
        // Clear form
        setFormData({
          firstName: '',
          lastName: '',
          businessName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        // Redirect to login page after a delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage('An error occurred during registration. Please try again.');
    }
  };

  return (
    <>
      <div className="content">
        <section className="hero">
          <h2>Grow Your Business with UCC Data</h2>
          <p>Access the most up-to-date Uniform Commercial Code (UCC) lists</p>
        </section>

        <section className="features">
          <h3>UCC Lists Can Help You</h3>
          <ul>
            <li><strong>Identify businesses in need of capital:</strong> Target those seeking working capital or loans.</li>
            <li><strong>Fund more deals:</strong> Get detailed lists for various financial leads.</li>
            <li><strong>Stay ahead of competition:</strong> Access monthly updated UCC filings.</li>
          </ul>
        </section>
      </div>

      <section className="register-form">
        <h3>Register Today to Get UCC List Data</h3>
        {errorMessage && (
          <div className="error-message">
            <p>{errorMessage}</p>
          </div>
        )}
        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="businessName"
              placeholder="Business Name"
              value={formData.businessName}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Business Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <button type="submit" className="register-button">Register</button>
          </div>
        </form>
        <p className="terms-notice">
          By registering, you agree to our Terms & Conditions and Privacy Policy.
        </p>
        <div className="login-link">
          Already have an account? <button onClick={() => navigate('/login')} className="link-button">Log in</button>
        </div>
      </section>

      <style jsx>{`
        .content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .hero {
          text-align: center;
          margin-bottom: 3rem;
        }

        .hero h2 {
          font-size: 2.5rem;
          color: #333;
          margin-bottom: 1rem;
        }

        .hero p {
          font-size: 1.2rem;
          color: #666;
        }

        .features {
          margin-bottom: 3rem;
        }

        .features h3 {
          font-size: 1.8rem;
          color: #333;
          margin-bottom: 1.5rem;
        }

        .features ul {
          list-style-type: none;
          padding: 0;
        }

        .features li {
          margin-bottom: 1rem;
          font-size: 1.1rem;
          color: #555;
        }

        .register-form {
          max-width: 500px;
          margin: 0 auto;
          padding: 2rem;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .register-form h3 {
          text-align: center;
          margin-bottom: 2rem;
          color: #333;
        }

        .form-group {
          margin-bottom: 1.5rem;
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

        .register-button {
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

        .register-button:hover {
          background-color: #357abd;
        }

        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .success-message {
          background-color: #e8f5e9;
          color: #2e7d32;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .terms-notice {
          text-align: center;
          font-size: 0.9rem;
          color: #666;
          margin-top: 1rem;
        }

        .login-link {
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
    </>
  );
}

export default Home;