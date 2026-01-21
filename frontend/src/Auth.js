import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

 const API_BASE = 'http://localhost:3000';
// const API_BASE = 'https://synhack-dep.onrender.com';


function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // new states for OTP flow
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  // added: signin loader state
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationError('');
    setInfoMessage('');

    try {
      const payload = isLogin
        ? { email, password }
        : { name, email, password };

      const url = isLogin ? `${API_BASE}/signin` : `${API_BASE}/signup`;

      if (isLogin) setIsSigningIn(true);
      const response = await axios.post(url, payload);

      if (isLogin) {
        const receivedToken = response.data.token;
        if (receivedToken) {
          localStorage.setItem('token', receivedToken);
          setIsSigningIn(false);
          // redirect to main App
          navigate('/home');
        } else {
          // ensure loader is cleared if no token returned
          setIsSigningIn(false);
        }
      } else {
        // signup: expect backend to send OTP to email.
        // show verification input instead of redirecting
        setAwaitingVerification(true);
        setInfoMessage(response.data?.message || 'OTP sent to your email. Enter it below to verify.');
      }
    } catch (err) {
      console.error(err);
      setIsSigningIn(false);
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setVerificationError('');
    setIsVerifying(true);
    try {
      // adjust endpoint name if your backend uses a different path
      const url = `${API_BASE}/verify-email`;
      const response = await axios.post(url, { email, otp });
      setIsVerifying(false);

      // on successful verification, redirect to signin page
      // set isLogin true in case this component remains mounted
      setIsLogin(true);
      setAwaitingVerification(false);
      setOtp('');
      setInfoMessage(response.data?.message || 'Email verified. Please sign in.');
      // navigate to signin route - adjust path if your app uses different route
      navigate('/signin');
    } catch (err) {
      console.error(err);
      setIsVerifying(false);
      setVerificationError(err.response?.data?.error || 'OTP verification failed');
    }
  };

  const handleResendOtp = async () => {
    setVerificationError('');
    setInfoMessage('');
    try {
      const url = `${API_BASE}/resend-otp`;
      const response = await axios.post(url, { email });
      setInfoMessage(response.data?.message || 'OTP resent to your email.');
    } catch (err) {
      console.error(err);
      setVerificationError(err.response?.data?.error || 'Failed to resend OTP');
    }
  };

  return (
    <div className="auth-container" aria-busy={isSigningIn || isVerifying}>
      {/* System-design themed loader (API gateway + servers + packets) */}
      {(isSigningIn || isVerifying) && (
        <div className="loader-overlay" role="status" aria-live="polite">
          <div className="sd-modal">
            <div className="sd-scene">
              <div className="gateway" aria-hidden="true">
                <div className="gateway-label">API</div>
                <div className="gateway-bars">
                  <span /><span /><span />
                </div>
              </div>

              <div className="servers">
                <div className="server">S1</div>
                <div className="server">S2</div>
                <div className="server">S3</div>
              </div>

              <div className="packets" aria-hidden="true">
                <span className="packet p1" />
                <span className="packet p2" />
                <span className="packet p3" />
              </div>
            </div>

            <div className="loader-text">
              <div className="loader-title">{isSigningIn ? 'Initializing session' : 'Verifying OTP'}</div>
              <div className="loader-sub">Simulating system-design flow — please wait...</div>
            </div>
          </div>
        </div>
      )}

      {/* Brand Header */}
      <div className="auth-brand">
        <h1>ArchiteX</h1>
        <div className="brand-subtitle">Design · Build · Innovate</div>
      </div>

      {/* Auth Box */}
      <div className="auth-box">
        <h2>{isLogin ? 'Welcome Back' : awaitingVerification ? 'Verify Email' : 'Create Account'}</h2>

        {/* show general errors */}
        {error && <div className="auth-error">{error}</div>}

        {/* show info messages (like "OTP sent") */}
        {infoMessage && <div className="auth-info">{infoMessage}</div>}

        {/* OTP verification UI shown only after signup */}
        {awaitingVerification ? (
          <form onSubmit={handleVerifyOtp}>
            {verificationError && <div className="auth-error">{verificationError}</div>}
            <div className="form-group">
              <label>OTP sent to {email}</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the OTP"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isVerifying}>
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>
            <div style={{ marginTop: 10 }}>
              Didn't receive? <span onClick={handleResendOtp} style={{ cursor: 'pointer', color: '#007bff' }}>Resend OTP</span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLogin ? isSigningIn : false}>
              {isLogin ? (isSigningIn ? 'Signing in...' : 'Sign In') : 'Create Account'}
            </button>
          </form>
        )}

        <div className="toggle-link">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <span onClick={() => { setIsLogin(false); setError(''); setInfoMessage(''); }}>{' '}Sign Up</span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span onClick={() => { setIsLogin(true); setAwaitingVerification(false); setError(''); setInfoMessage(''); }}>{' '}Sign In</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;