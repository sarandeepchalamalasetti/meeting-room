import React, { useState, useEffect, useRef } from 'react';
import './Login.css';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Login = ({ onToggleToRegister , onLoginSuccess }) => {
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [cardRotation, setCardRotation] = useState({ x: 0, y: 0 });
  const [bubbles, setBubbles] = useState([]);
  const [showPasswordToggle, setShowPasswordToggle] = useState(false);
  const [showConfirmPasswordToggle, setShowConfirmPasswordToggle] = useState(false);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'forgotPassword', 'otpVerification', 'passwordReset'
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const navigate = useNavigate();

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [passwordResetData, setPasswordResetData] = useState({
    password: '',
    confirmPassword: ''
  });

  const colorTheme = {
    bg: "linear-gradient(to bottom right, #312e81, #6b21a8, #be185d)",
    particles: ["hsl(240, 90%, 50%)", "hsl(280, 90%, 60%)", "hsl(320, 90%, 70%)"]
  };

  const bubbleIdRef = useRef(0);
  const cardWrapperRef = useRef(null);
  const dynamicBgRef = useRef(null);
  const particlesContainerRef = useRef(null);
  const energyRingsRef = useRef(null);
  const digitalRainRef = useRef(null);
  const neuralNetworkRef = useRef(null);
  const otpRefs = useRef([]);

  useEffect(() => {
    createParticles();
    createEnergyRings();
    createDigitalRain();
    createNeuralNetwork();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(prev => prev.filter(b => Date.now() - b.timestamp < 2000));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e) => {
    const newMousePosition = { x: e.clientX, y: e.clientY };
    if (dynamicBgRef.current) {
      const bgX = (newMousePosition.x / window.innerWidth) * 100;
      const bgY = (newMousePosition.y / window.innerHeight) * 100;
      dynamicBgRef.current.style.background = `radial-gradient(circle at ${bgX}% ${bgY}%, ${colorTheme.particles[0]}, transparent 50%)`;
    }

    if (!isHoveringCard) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const rotateX = (e.clientY - centerY) / 30;
      const rotateY = (centerX - e.clientX) / 30;
      setCardRotation({ x: rotateX, y: rotateY });
    }

    createBubble(e.clientX, e.clientY);
  };

  const handleCardMouseEnter = () => {
    setIsHoveringCard(true);
    setCardRotation({ x: 0, y: 0 });
  };

  const handleCardMouseLeave = () => {
    setIsHoveringCard(false);
  };

  const togglePassword = () => {
    setShowPasswordToggle(!showPasswordToggle);
  };

  const toggleConfirmPassword = () => {
    setShowConfirmPasswordToggle(!showConfirmPasswordToggle);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordResetChange = (e) => {
    const { name, value } = e.target;
    setPasswordResetData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { identifier, password } = formData;

    if (!identifier || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('token',data.token);
        sessionStorage.setItem('user',JSON.stringify(data.user));
        sessionStorage.setItem('role', data.user.role);
        toast.success(`You are logged in. Welcome, ${data.user.name}`);
        setFormData({
          identifier: '',
          password: ''
        });
       setTimeout(() => {
  navigate("/dashboard");
}, 1500);

        onLoginSuccess();
      } 
      else {
        toast.error(data.message || 'Login failed. Please register.');
        setTimeout(() => {
          onToggleToRegister();
        }, 2000);

      }
      
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleToggleMode = (e) => {
    e.preventDefault();
    onToggleToRegister();
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setCurrentView('forgotPassword');
  };

  const handleBackToLogin = (e) => {
    e.preventDefault();
    setCurrentView('login');
    setForgotPasswordEmail('');
    setOtpValues(['', '', '', '', '', '']);
    setPasswordResetData({
      password: '',
      confirmPassword: ''
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      toast.error("Please enter your registered email.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: forgotPasswordEmail })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("OTP sent to your email.");
        setCurrentView('otpVerification'); // Fixed: consistent view state name
      } else {
        toast.error(data.message || "Email not found. Please register.");
        setTimeout(() => {
          onToggleToRegister();
        }, 2000);
      }
    } catch (error) {
      toast.error("Failed to send OTP. Try again later.");
      console.error(error);
    }
  };
  

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = value;
      setOtpValues(newOtpValues);

      // Auto-focus next input
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    const otpString = otpValues.join('');

    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail, otp: otpString })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OTP verified! Please reset your password.');
        setCurrentView('passwordReset'); // Fixed: consistent view state name
      } else {
        toast.error(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while verifying OTP.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const { password, confirmPassword } = passwordResetData;

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          newPassword: password,
          confirmPassword: confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password updated successfully! Redirecting to login...");
        setPasswordResetData({ password: '', confirmPassword: '' });
        setForgotPasswordEmail('');
        setOtpValues(['', '', '', '', '', '']);

        setTimeout(() => {
          setCurrentView('login');
        }, 2000);
      } else {
        toast.error(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Try again later.");
    }
  };

  const handleResendOTP = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: forgotPasswordEmail })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("OTP resent successfully!");
        setOtpValues(['', '', '', '', '', '']); // Clear previous OTP values
      } else {
        toast.error(data.message || "Failed to resend OTP.");
      }
    } catch (error) {
      toast.error("Failed to resend OTP. Try again later.");
      console.error(error);
    }
  };

  const createBubble = (x, y) => {
    const bubble = {
      id: ++bubbleIdRef.current,
      x,
      y,
      size: Math.random() * 30 + 10,
      color: colorTheme.particles[Math.floor(Math.random() * 3)],
      timestamp: Date.now()
    };
    setBubbles(prev => [...prev.slice(-7), bubble]);
  };

  const createParticles = () => {
    if (!particlesContainerRef.current) return;
    const container = particlesContainerRef.current;
    container.innerHTML = '';
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.width = particle.style.height = Math.random() * 8 + 3 + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.background = colorTheme.particles[Math.floor(Math.random() * 3)];
      particle.style.animationDelay = Math.random() * 5 + 's';
      particle.style.animationDuration = Math.random() * 4 + 6 + 's';
      container.appendChild(particle);
    }
  };

  const createEnergyRings = () => {
    if (!energyRingsRef.current) return;
    const container = energyRingsRef.current;
    const sizes = [140, 200, 260, 320];
    container.innerHTML = '';
    sizes.forEach((size, i) => {
      const ring = document.createElement('div');
      ring.className = 'energy-ring';
      ring.style.width = ring.style.height = size + 'px';
      ring.style.left = ring.style.top = -size / 2 + 'px';
      ring.style.border = `3px solid ${colorTheme.particles[i % 3]}`;
      ring.style.animationDelay = (i * 2) + 's';
      ring.style.animationDuration = (8 + i * 2) + 's';
      container.appendChild(ring);
    });
  };

  const createDigitalRain = () => {
    if (!digitalRainRef.current) return;
    const container = digitalRainRef.current;
    container.innerHTML = '';
    for (let i = 0; i < 15; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.left = Math.random() * 100 + '%';
      drop.style.height = Math.random() * 120 + 60 + 'px';
      drop.style.animation = `digitalRain ${Math.random() * 3 + 2}s infinite linear ${Math.random() * 5}s`;
      container.appendChild(drop);
    }
  };

  const createNeuralNetwork = () => {
    if (!neuralNetworkRef.current) return;
    const container = neuralNetworkRef.current;
    container.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const node = document.createElement('div');
      node.className = 'neural-node';
      node.style.left = (15 + (i % 4) * 25) + '%';
      node.style.top = (15 + Math.floor(i / 4) * 25) + '%';
      node.style.animationDelay = (i * 0.4) + 's';
      container.appendChild(node);
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'neural-connection');
    for (let i = 0; i < 9; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'neural-line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', (25 + Math.random() * 35) + '%');
      line.setAttribute('y2', (15 + Math.random() * 25) + '%');
      line.style.animationDelay = (i * 0.2) + 's';
      svg.appendChild(line);
    }
    container.appendChild(svg);
  };

  const renderLoginForm = () => (
    <>
      <div className="header">
        <div className="header-icons">
          <i className="fas fa-sparkles header-icon"></i>
          <span className="ispace-logo-wrapper">
            <span className="i-letter">i</span>
            <span className="space-text">Space</span>
            <img
              className="ispace-logo-img"
              src="data:image/png;base64,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"
              alt="iSpace Logo"
            />
          </span>
        </div>
        <p className="subtitle">Login</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-container">
          <div className="form-group">
            <div className="input-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder="Email or Employee ID"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
              />
              <div className="input-glow"></div>
              <i className="fas fa-id-card input-icon accent-3"></i>
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <input
                type={showPasswordToggle ? 'text' : 'password'}
                className="form-input"
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
              />
              <div className="input-glow"></div>
              <i className="fas fa-lock input-icon accent-1"></i>
              <button
                type="button"
                className="password-toggle"
                onClick={togglePassword}
              >
                <i className={`fas ${showPasswordToggle ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn">
          <div className="btn-shimmer"></div>
          <div className="btn-content">
            <span>LOG IN</span>
          </div>
        </button>
      </form>

      <div className="forgot-password-section">
        <a href="#" className="forgot-password-link" onClick={handleForgotPassword}>
          Forgot Password?
        </a>
      </div>

      <div className="footer">
        <span className="footer-text">DON'T HAVE AN ACCOUNT?</span>
        <a href="#" className="footer-link" onClick={handleToggleMode}>
          Register
        </a>
      </div>
    </>
  );

  const renderForgotPasswordForm = () => (
    <>
      <div className="header">
        <div className="header-icons">
          <i className="fas fa-key header-icon"></i>
          <span className="ispace-logo-wrapper">
            <span className="i-letter">i</span>
            <span className="space-text">Space</span>
            <img
              className="ispace-logo-img"
              src="data:image/png;base64,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"
              alt="iSpace Logo"
            />
          </span>
        </div>
        <p className="subtitle">Forgot Password</p>
      </div>

      <form onSubmit={handleSendOTP}>
        <div className="form-container">
          <div className="form-group">
            <div className="input-wrapper">
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email address"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
              />
              <div className="input-glow"></div>
              <i className="fas fa-envelope input-icon accent-2"></i>
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn">
          <div className="btn-shimmer"></div>
          <div className="btn-content">
            <span>SEND OTP</span>
          </div>
        </button>
      </form>

      <div className="footer">
        <span className="footer-text">REMEMBER YOUR PASSWORD?</span>
        <a href="#" className="footer-link" onClick={handleBackToLogin}>
          Back to Login
        </a>
      </div>
    </>
  );

  const renderOTPVerificationForm = () => (
    <>
      <div className="header">
        <div className="header-icons">
          <i className="fas fa-shield-alt header-icon"></i>
          <span className="ispace-logo-wrapper">
            <span className="i-letter">i</span>
            <span className="space-text">Space</span>
            <img
              className="ispace-logo-img"
              src="data:image/png;base64,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"
              alt="iSpace Logo"
            />
          </span>
        </div>
        <p className="subtitle">Enter OTP</p>
      </div>

      <form onSubmit={handleVerifyOTP}>
        <div className="form-container">
          <div className="otp-container">
            {otpValues.map((value, index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                className="otp-input"
                maxLength="1"
                value={value}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
              />
            ))}
          </div>
        </div>

        <button type="submit" className="submit-btn">
          <div className="btn-shimmer"></div>
          <div className="btn-content">
            <span>VERIFY OTP</span>
          </div>
        </button>
      </form>

      <div className="footer">
        <span className="footer-text">DIDN'T RECEIVE OTP?</span>
        <a href="#" className="footer-link" onClick={handleResendOTP}>
          Resend
        </a>
      </div>
    </>
  );

  const renderPasswordResetForm = () => (
    <>
      <div className="header">
        <div className="header-icons">
          <i className="fas fa-lock header-icon"></i>
          <span className="ispace-logo-wrapper">
            <span className="i-letter">i</span>
            <span className="space-text">Space</span>
            <img
              className="ispace-logo-img"
              src="data:image/png;base64,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"
              alt="iSpace Logo"
            />
          </span>
        </div>
        <p className="subtitle">Reset Password</p>
      </div>

      <form onSubmit={handleResetPassword}>
        <div className="form-container">
          <div className="form-group">
            <div className="input-wrapper">
              <input
                type={showPasswordToggle ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter new password"
                name="password"
                value={passwordResetData.password}
                onChange={handlePasswordResetChange}
              />
              <div className="input-glow"></div>
              <i className="fas fa-lock input-icon accent-1"></i>
              <button
                type="button"
                className="password-toggle"
                onClick={togglePassword}
              >
                <i className={`fas ${showPasswordToggle ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <input
                type={showConfirmPasswordToggle ? 'text' : 'password'}
                className="form-input"
                placeholder="Confirm new password"
                name="confirmPassword"
                value={passwordResetData.confirmPassword}
                onChange={handlePasswordResetChange}
              />
              <div className="input-glow"></div>
              <i className="fas fa-lock input-icon accent-2"></i>
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPassword}
              >
                <i className={`fas ${showConfirmPasswordToggle ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn">
          <div className="btn-shimmer"></div>
          <div className="btn-content">
            <span>RESET PASSWORD</span>
          </div>
        </button>
      </form>

      <div className="footer">
        <span className="footer-text">REMEMBER YOUR PASSWORD?</span>
        <a href="#" className="footer-link" onClick={handleBackToLogin}>
          Back to Login
        </a>
      </div>
    </>
  );

  return (
    <div className="login-container" onMouseMove={handleMouseMove}>
      <div className="bubble-container">
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="bubble"
            style={{
              left: bubble.x - bubble.size / 2,
              top: bubble.y - bubble.size / 2,
              width: bubble.size,
              height: bubble.size,
              background: `radial-gradient(circle, ${bubble.color} 0%, transparent 70%)`,
              border: `1px solid ${bubble.color}40`
            }}
          />
        ))}
      </div>

      <div className="dynamic-bg" ref={dynamicBgRef}></div>
      <div className="bg-layers">
        <div className="bg-layer bg-layer-1"></div>
        <div className="bg-layer bg-layer-2"></div>
        <div className="bg-layer bg-layer-3"></div>
      </div>
      <div className="particles-container" ref={particlesContainerRef}></div>
      <div className="energy-rings" ref={energyRingsRef}></div>

      <div className="main-container">
        <div
          className="card-wrapper"
          ref={cardWrapperRef}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >
          <div
            className="form-card"
            style={{
              transform: `rotateX(${cardRotation.x}deg) rotateY(${cardRotation.y}deg)`
            }}
          >
            <div className="scan-lines">
              <div className="scan-line-h"></div>
              <div className="scan-line-v"></div>
            </div>

            <div className="digital-rain" ref={digitalRainRef}></div>
            <div className="neural-network" ref={neuralNetworkRef}></div>
            <div className="breathing-border"></div>

            {currentView === 'login' && renderLoginForm()}
            {currentView === 'forgotPassword' && renderForgotPasswordForm()}
            {currentView === 'otpVerification' && renderOTPVerificationForm()}
            {currentView === 'passwordReset' && renderPasswordResetForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;