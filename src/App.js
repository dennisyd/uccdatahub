// File: src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './css/styles.css';
import Home from './components/Home';
import About from './components/About';
import SignIn from './components/SignIn';
import Hub from './components/Hub';
import AdminPage from './components/AdminPage';

function App() {
  return (
    <Router>
      <div className="App">
        <header>
          <h1 className="site-title">UCC Data Hub</h1>
          <nav>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/signin">Sign In</Link></li>
              <li><Link to="/admin">Admin</Link></li>
            </ul>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/hub" element={<Hub />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>

        <footer>
          <p>&copy; 2024 UCC Data Hub. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;