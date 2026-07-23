import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 500 },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' }, className: 'shadow-lg border border-emerald-100 dark:border-emerald-900 !bg-white dark:!bg-gray-900 !text-gray-900 dark:!text-gray-100' },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' }, className: 'shadow-lg border border-red-100 dark:border-red-900 !bg-white dark:!bg-gray-900 !text-gray-900 dark:!text-gray-100' },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
