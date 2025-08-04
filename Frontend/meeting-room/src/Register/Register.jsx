import React, { useState, useEffect, useRef } from 'react';
import './Register.css';
import { toast } from 'react-toastify';

const Register = ({ onToggleToLogin }) => {
  // State management
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [cardRotation, setCardRotation] = useState({ x: 0, y: 0 });
  const [bubbles, setBubbles] = useState([]);
  const [showPasswordToggle, setShowPasswordToggle] = useState(false);
  const [showConfirmPasswordToggle, setShowConfirmPasswordToggle] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    role: '',
    password: '',
    confirmPassword: ''
  });

  // Role options
  const roleOptions = [
    { value: '', label: 'Select Role' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr', label: 'HR' },
    { value: 'employee', label: 'Employee' },
    { value: 'admin', label: 'Admin' }
  ];

  // Color theme
  const colorTheme = {
    bg: "linear-gradient(to bottom right, #312e81, #6b21a8, #be185d)",
    particles: ["hsl(240, 90%, 50%)", "hsl(280, 90%, 60%)", "hsl(320, 90%, 70%)"]
  };

  // Refs
  const bubbleIdRef = useRef(0);
  const cardWrapperRef = useRef(null);
  const dynamicBgRef = useRef(null);
  const particlesContainerRef = useRef(null);
  const energyRingsRef = useRef(null);
  const digitalRainRef = useRef(null);
  const neuralNetworkRef = useRef(null);

  // Initialize effects on mount
  useEffect(() => {
    createParticles();
    createEnergyRings();
    createDigitalRain();
    createNeuralNetwork();
  }, []);

  // Bubble cleanup effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(prev => prev.filter(bubble => Date.now() - bubble.timestamp < 2000));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Mouse move handler
  const handleMouseMove = (e) => {
    const newMousePosition = { x: e.clientX, y: e.clientY };

    // Update dynamic background
    if (dynamicBgRef.current) {
      const bgX = (newMousePosition.x / window.innerWidth) * 100;
      const bgY = (newMousePosition.y / window.innerHeight) * 100;
      dynamicBgRef.current.style.background = `radial-gradient(circle at ${bgX}% ${bgY}%, ${colorTheme.particles[0]}, transparent 50%)`;
    }

    // Card rotation when not hovering
    if (!isHoveringCard) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const rotateX = (e.clientY - centerY) / 30;
      const rotateY = (centerX - e.clientX) / 30;
      
      setCardRotation({ x: rotateX, y: rotateY });
    }

    // Create bubbles
    createBubble(e.clientX, e.clientY);
  };

  // Card hover handlers
  const handleCardMouseEnter = () => {
    setIsHoveringCard(true);
    setCardRotation({ x: 0, y: 0 });
  };

  const handleCardMouseLeave = () => {
    setIsHoveringCard(false);
  };

  // Form management
  const togglePassword = (field) => {
    if (field === 'password') {
      setShowPasswordToggle(!showPasswordToggle);
    } else {
      setShowConfirmPasswordToggle(!showConfirmPasswordToggle);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ UPDATED: Handle form submission with new role-based authentication endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, employeeId, role, password, confirmPassword } = formData;

    if (!name || !email || !employeeId || !role || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      console.log('📝 Submitting registration to role-based system:', formData);
      
      // ✅ UPDATED: Using the new auth route that handles JSON validation
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('📝 Registration response:', data);

      if (response.ok) {
        toast.success(data.message);
        setFormData({
          name: '',
          email: '',
          employeeId: '',
          role: '',
          password: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          onToggleToLogin(); // redirect to login after 2 sec
        }, 2000);
      } else if (data.forceEmployee) {
        // ✅ UPDATED: Handle role validation failure (not in JSON data)
        toast.warn(data.message + ' Registration will proceed as employee.');
        
        // Auto-register as employee after warning
        setTimeout(async () => {
          try {
            const employeeData = { ...formData, role: 'employee' };
            const employeeResponse = await fetch("http://localhost:5000/api/auth/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(employeeData)
            });
            
            const employeeResult = await employeeResponse.json();
            if (employeeResponse.ok) {
              toast.success('Successfully registered as employee!');
              setFormData({
                name: '',
                email: '',
                employeeId: '',
                role: '',
                password: '',
                confirmPassword: ''
              });
              setTimeout(() => {
                onToggleToLogin();
              }, 2000);
            } else {
              toast.error(employeeResult.message);
            }
          } catch (error) {
            toast.error('Employee registration failed. Please try again.');
          }
        }, 3000);
        
      } else {
        // ❌ Email or employeeId already exists — stay on register
        toast.error(data.message);
        setFormData({
          name: '',
          email: '',
          employeeId: '',
          role: '',
          password: '',
          confirmPassword: ''
        });
        if (data.message.includes("already exist")) {
          setTimeout(() => {
            onToggleToLogin(); // go to login page
          }, 2000);
        }
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleToggleMode = (e) => {
    e.preventDefault();
    onToggleToLogin();
  };

  // Bubble creation
  const createBubble = (x, y) => {
    const bubble = {
      id: ++bubbleIdRef.current,
      x: x,
      y: y,
      size: Math.random() * 30 + 10,
      color: colorTheme.particles[Math.floor(Math.random() * 3)],
      timestamp: Date.now()
    };
    
    setBubbles(prev => {
      const newBubbles = [...prev, bubble];
      return newBubbles.slice(-8);
    });
  };

  // Create particles
  const createParticles = () => {
    if (!particlesContainerRef.current) return;
    
    const container = particlesContainerRef.current;
    container.innerHTML = '';
    
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.width = Math.random() * 8 + 3 + 'px';
      particle.style.height = particle.style.width;
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.background = colorTheme.particles[Math.floor(Math.random() * colorTheme.particles.length)];
      particle.style.animationDelay = Math.random() * 5 + 's';
      particle.style.animationDuration = Math.random() * 4 + 6 + 's';
      
      container.appendChild(particle);
    }
  };

  // Create energy rings
  const createEnergyRings = () => {
    if (!energyRingsRef.current) return;
    
    const container = energyRingsRef.current;
    const sizes = [140, 200, 260, 320];
    
    container.innerHTML = '';
    
    sizes.forEach((size, index) => {
      const ring = document.createElement('div');
      ring.className = 'energy-ring';
      ring.style.width = size + 'px';
      ring.style.height = size + 'px';
      ring.style.left = (-size/2) + 'px';
      ring.style.top = (-size/2) + 'px';
      ring.style.border = `3px solid ${colorTheme.particles[index % colorTheme.particles.length]}`;
      ring.style.animationDelay = (index * 2) + 's';
      ring.style.animationDuration = (8 + index * 2) + 's';
      
      container.appendChild(ring);
    });
  };

  // Create digital rain
  const createDigitalRain = () => {
    if (!digitalRainRef.current) return;
    
    const container = digitalRainRef.current;
    container.innerHTML = '';
    
    for (let i = 0; i < 15; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.left = Math.random() * 100 + '%';
      drop.style.height = Math.random() * 120 + 60 + 'px';
      drop.style.animationDuration = Math.random() * 3 + 2 + 's';
      drop.style.animationDelay = Math.random() * 5 + 's';
      drop.style.animation = `digitalRain ${Math.random() * 3 + 2}s infinite linear ${Math.random() * 5}s`;
      
      container.appendChild(drop);
    }
  };

  // Create neural network
  const createNeuralNetwork = () => {
    if (!neuralNetworkRef.current) return;
    
    const container = neuralNetworkRef.current;
    container.innerHTML = '';
    
    // Create nodes
    for (let i = 0; i < 10; i++) {
      const node = document.createElement('div');
      node.className = 'neural-node';
      node.style.left = (15 + (i % 4) * 25) + '%';
      node.style.top = (15 + Math.floor(i / 4) * 25) + '%';
      node.style.animationDelay = (i * 0.4) + 's';
      
      container.appendChild(node);
    }
    
    // Create connections
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

  return (
    <div className="register-container" onMouseMove={handleMouseMove}>
      {/* Mouse Bubble Effects Container */}
      <div className="bubble-container">
        {bubbles.map(bubble => (
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

      {/* Dynamic Background */}
      <div className="dynamic-bg" ref={dynamicBgRef}></div>

      {/* Background Layers */}
      <div className="bg-layers">
        <div className="bg-layer bg-layer-1"></div>
        <div className="bg-layer bg-layer-2"></div>
        <div className="bg-layer bg-layer-3"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles-container" ref={particlesContainerRef}></div>

      {/* Energy Rings */}
      <div className="energy-rings" ref={energyRingsRef}></div>

      {/* Main Container */}
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
            {/* Scan Lines */}
            <div className="scan-lines">
              <div className="scan-line-h"></div>
              <div className="scan-line-v"></div>
            </div>

            {/* Digital Rain */}
            <div className="digital-rain" ref={digitalRainRef}></div>

            {/* Neural Network */}
            <div className="neural-network" ref={neuralNetworkRef}></div>

            {/* Breathing Border */}
            <div className="breathing-border"></div>

            {/* Header */}
            <div className="header">
              <div className="header-icons">
                <i className="fas fa-sparkles header-icon"></i>
                <span className="ispace-logo-wrapper">
                  <span className="i-letter">i</span>
                  <span className="space-text">Space</span>
                  <img className="ispace-logo-img" src="data:image/png;base64,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" alt="iSpace Logo" />
                </span>
              </div>
              <p className="subtitle">Register</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-container">
                {/* Name Field */}
                <div className="form-group">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                    <div className="input-glow"></div>
                    <i className="fas fa-user input-icon accent-1"></i>
                  </div>
                </div>

                {/* Email Field */}
                <div className="form-group">
                  <div className="input-wrapper">
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Office Email ID"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    <div className="input-glow"></div>
                    <i className="fas fa-envelope input-icon accent-2"></i>
                  </div>
                </div>

                {/* Employee ID Field */}
                <div className="form-group">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Employee ID "
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                    />
                    <div className="input-glow"></div>
                    <i className="fas fa-id-card input-icon accent-3"></i>
                  </div>
                </div>

                {/* Role Field */}
                <div className="form-group">
                  <div className="input-wrapper">
                    <select
                      className="form-input form-select"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="input-glow"></div>
                    <i className="fas fa-users input-icon accent-1"></i>
                    <i className="fas fa-chevron-down select-arrow"></i>
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-group">
                  <div className="input-wrapper">
                    <input
                      type={showPasswordToggle ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter Password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <div className="input-glow"></div>
                    <i className="fas fa-lock input-icon accent-1"></i>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePassword('password')}
                    >
                      <i className={`fas ${showPasswordToggle ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="form-group">
                  <div className="input-wrapper">
                    <input
                      type={showConfirmPasswordToggle ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Confirm Password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                    <div className="input-glow"></div>
                    <i className="fas fa-lock input-icon accent-2"></i>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePassword('confirmPassword')}
                    >
                      <i className={`fas ${showConfirmPasswordToggle ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" className="submit-btn">
                <div className="btn-shimmer"></div>
                <div className="btn-content">
                  <span>JOIN NETWORK</span>
                </div>
              </button>
            </form>

            {/* Footer */}
            <div className="footer">
              <span className="footer-text">Already connected?</span>
              <a href="#" className="footer-link" onClick={handleToggleMode}>
                Log In
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;