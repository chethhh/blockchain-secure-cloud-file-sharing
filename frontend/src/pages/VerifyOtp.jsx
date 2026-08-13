import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes timer
  const { verifyOtp, pendingEmail, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!pendingEmail) {
      navigate('/login');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingEmail, navigate]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    try {
      await verifyOtp(otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendMsg('');
    try {
      await authAPI.resendOtp({ email: pendingEmail });
      setResendMsg('A new OTP has been sent to your email.');
      setCountdown(300);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <KeyRound size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Multi-Factor Authentication</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            Enter the 6-digit verification code sent to <strong>{pendingEmail}</strong>
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {resendMsg && <div className="alert alert-success">{resendMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Enter 6-Digit OTP</label>
            <input
              type="text"
              maxLength={6}
              required
              autoFocus
              className="form-control"
              style={{
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                textAlign: 'center',
                fontWeight: 700,
                marginTop: '0.5rem'
              }}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>

          <div style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            fontSize: '0.8125rem',
            color: '#64748b',
            margin: '1rem 0'
          }}>
            <span>Expires in: <strong>{formatTimer(countdown)}</strong></span>
            <button
              type="button"
              onClick={handleResend}
              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
            >
              Resend OTP
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? 'Verifying OTP...' : 'Verify OTP & Complete Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
