import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();
const adminEmail = String(process.env.REACT_APP_ADMIN_EMAIL).trim().toLowerCase();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    userId: null,
    userEmail: null,
    userName: null,
    loginTime: null,
    isAuthenticated: false,
  });
  
  const isAdmin = adminEmail === String(user.userEmail).trim().toLowerCase();

  const login = (userId, userEmail, userName) => {
    setUser({
      userId,
      userEmail,
      userName,
      loginTime: new Date().toISOString(),
      isAuthenticated: true,
    });
  };

  const logout = () => {
    setUser({
      userId: null,
      userEmail: null,
      userName: null,
      loginTime: null,
      isAuthenticated: false,
    });
  };

  return (
    <UserContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
};

// Create a custom hook to use the UserContext
export const useUser = () => useContext(UserContext);
