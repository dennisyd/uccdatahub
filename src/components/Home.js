import React, { useState } from 'react';

function Home() {
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

  const handleSubmit = (event) => {
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

    // Here you would typically send the data to your backend API
    console.log('Form submitted:', formData);
    setSuccessMessage('Registration successful! Check your email for further instructions.');

    // Clear form after successful submission
    setFormData({
      firstName: '',
      lastName: '',
      businessName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
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
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="firstName" 
            placeholder="First Name" 
            value={formData.firstName} 
            onChange={handleInputChange} 
            required 
          />
          <input 
            type="text" 
            name="lastName" 
            placeholder="Last Name" 
            value={formData.lastName} 
            onChange={handleInputChange} 
            required 
          />
          <input 
            type="text" 
            name="businessName" 
            placeholder="Business Name" 
            value={formData.businessName} 
            onChange={handleInputChange} 
            required 
          />
          <input 
            type="email" 
            name="email" 
            placeholder="Business Email" 
            value={formData.email} 
            onChange={handleInputChange} 
            required 
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={formData.password} 
            onChange={handleInputChange} 
            required 
          />
          <input 
            type="password" 
            name="confirmPassword" 
            placeholder="Confirm Password" 
            value={formData.confirmPassword} 
            onChange={handleInputChange} 
            required 
          />
          <button type="submit">Register</button>
        </form>
        <p>By registering, you agree to our Terms & Conditions and Privacy Policy.</p>
      </section>
    </>
  );
}

export default Home;