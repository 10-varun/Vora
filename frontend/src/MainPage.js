import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate(); // Initialize navigation function
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleGoogleAuth = () => {
    console.log('Google authentication initiated');
  };

  return (
    <div className="main-container">
      <header className="header">
        <div className="logo">
          <h1>Vora</h1>
          <p className="tagline">Master your communication skills</p>
        </div>
        <nav className="nav-buttons">
          {/* Navigate to Login Page */}
          <button className="btn login-btn" onClick={() => navigate('/login')}>Log In</button>

          {/* Navigate to SignUp Page */}
          <button className="btn signup-btn" onClick={() => navigate('/SignUp')}>Sign Up</button>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <h2>Elevate Your Professional Communication</h2>
          <p>Practice interviews, negotiate salaries, and improve your vocabulary with AI-powered feedback</p>
          <div className="cta-buttons">
            <button className="btn primary-btn">Get Started</button>
            <button className="btn secondary-btn">Learn More</button>
          </div>
        </div>
        <div className="hero-image">
          <div className="vora-illustration"></div>
        </div>
      </section>

      <section className="features-section">
        <h2>What Vora Offers</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon vocabulary-icon"></div>
            <h3>Vocabulary Assessment</h3>
            <p>Get real-time feedback on your word choice and language proficiency</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon interview-icon"></div>
            <h3>HR Interview Simulation</h3>
            <p>Practice with common interview questions and receive expert tips</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon negotiation-icon"></div>
            <h3>Salary Negotiation</h3>
            <p>Learn effective strategies to negotiate your worth confidently</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon speaking-icon"></div>
            <h3>Speaking Skills</h3>
            <p>Improve clarity, tone, and delivery for impactful communication</p>
          </div>
        </div>
      </section>

      <section className="demo-section">
        <h2>Try Vora Right Now</h2>
        <p>Record a short response or type your answer to the question below:</p>
        <div className="sample-question">
          <h3>"Tell me about a challenge you faced at work and how you overcame it."</h3>
        </div>
        <div className="input-methods">
          <div className="text-input">
            <textarea placeholder="Type your response here..."></textarea>
          </div>
          <div className="divider">OR</div>
          <div className="voice-input">
            <button 
              className={`record-btn ${isRecording ? 'recording' : ''}`} 
              onClick={toggleRecording}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            {isRecording && <div className="recording-indicator">Recording...</div>}
          </div>
        </div>
        <button className="btn analyze-btn" disabled={!isRecording}>Analyze My Response</button>
      </section>

      <footer className="footer">
        <div className="footer-logo">Vora</div>
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
        <div className="footer-copyright">© 2025 Vora. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default MainPage;
