import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import './css/styles.css';
import Home from './components/Home';
import About from './components/About';
import SignIn from './components/SignIn';
import Hub from './components/Hub';
import AdminPage from './components/AdminPage';

// PayPal configuration options
const paypalOptions = {
  "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID,
  currency: "USD",
  intent: "capture",
  components: "buttons"
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Check authentication status on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const userId = localStorage.getItem('userId');
      setIsAuthenticated(!!userId);
      setIsLoading(false);
    };

    // Initial check
    checkAuth();

    // Listen for localStorage changes
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('loginTime');
    setIsAuthenticated(false);
  };

  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return <Navigate to="/signin" replace />;
    }
    
    return children;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <Router>
        <div className="App min-h-screen flex flex-col">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <h1 className="site-title text-2xl font-bold text-gray-900">UCC Data Hub</h1>
                <nav>
                  <ul className="flex space-x-6">
                    <li>
                      <Link to="/" className="text-gray-700 hover:text-gray-900">
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link to="/about" className="text-gray-700 hover:text-gray-900">
                        About
                      </Link>
                    </li>
                    {!isAuthenticated ? (
                      <li>
                        <Link to="/signin" className="text-gray-700 hover:text-gray-900">
                          Sign In
                        </Link>
                      </li>
                    ) : (
                      <>
                        <li>
                          <Link to="/hub" className="text-gray-700 hover:text-gray-900">
                            Hub
                          </Link>
                        </li>
                        <li>
                          <button
                            onClick={handleSignOut}
                            className="text-gray-700 hover:text-gray-900"
                          >
                            Sign Out
                          </button>
                        </li>
                      </>
                    )}
                    <li>
                      <Link to="/admin" className="text-gray-700 hover:text-gray-900">
                        Admin
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </header>

          <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/login" element={<SignIn />} />
              <Route
                path="/hub"
                element={
                  <ProtectedRoute>
                    <Hub />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          <footer className="bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <p className="text-center text-gray-600">
                &copy; {new Date().getFullYear()} UCC Data Hub. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </PayPalScriptProvider>
  );
}

export default App;