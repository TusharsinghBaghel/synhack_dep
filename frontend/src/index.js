// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Auth from './Auth';
import Home from './Home';
import AuthCallback from './AuthCallback';
import ProtectedRoute from './ProtectedRoute';
import CompleteProfile from './completeprofile';
import QuestionsDetail from './components/QuestionsDetail';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>

          {/* Login */}
          <Route path="/" element={<Auth />} />

          {/* Google OAuth callback (UNPROTECTED) */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Google OAuth callback (UNPROTECTED) */}
          <Route path="/complete-profile" element={<CompleteProfile />} />


          {/* Protected routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/question/:id"
            element={
              <ProtectedRoute>
                <QuestionsDetail />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);