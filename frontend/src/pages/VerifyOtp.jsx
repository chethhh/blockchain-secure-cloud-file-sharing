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
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '2rem',
        border: '3px solid #ffccd5',
        boxShadow: '0 20px 50px rgba(255, 117, 151, 0.25)',
        padding: '2.5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff7597, #ff4d6d)',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 6px 20px rgba(255, 77, 109, 0.35)',
            fontSize: '2rem'
          }}>
            🐱
          </div>
          <h2 style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#22223b'
          }}>
            VERIFY OTP 🐾
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#ff4d6d', fontWeight: 700, marginTop: '0.375rem' }}>
            Multi-Factor Security Code sent to <strong>{pendingEmail}</strong>
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {resendMsg && <div className="alert alert-success">{resendMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22223b' }}>Enter 6-Digit OTP Code</label>
            <input
              type="text"
              maxLength={6}
              required
              autoFocus
              className="form-control"
              style={{
                fontSize: '1.75rem',
                letterSpacing: '0.5rem',
                textAlign: 'center',
                fontWeight: 700,
                marginTop: '0.5rem',
                color: '#ff4d6d',
                borderColor: '#ffccd5'
              }}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.875rem',
            color: '#4a4e69',
            margin: '1.25rem 0'
          }}>
            <span>Expires in: <strong>{formatTimer(countdown)}</strong></span>
            <button
              type="button"
              onClick={handleResend}
              style={{ background: 'none', border: 'none', color: '#ff4d6d', cursor: 'pointer', fontWeight: 700 }}
            >
              Resend OTP 🐾
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem' }}
          >
            {loading ? 'Verifying OTP...' : 'Verify & Sign In 🐾'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
