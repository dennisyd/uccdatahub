import React from 'react';
   import ReactDOM from 'react-dom/client';
   import './tailwind.css';
   import App from './App';
   import reportWebVitals from './reportWebVitals';
import { UserProvider } from './contexts/UserContext';

   const root = ReactDOM.createRoot(document.getElementById('root'));
   root.render(
     <React.StrictMode>
      <UserProvider>
        <App />
      </UserProvider>
     </React.StrictMode>
   );

   reportWebVitals();