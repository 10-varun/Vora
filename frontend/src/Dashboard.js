import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate();
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [currentPathId, setCurrentPathId] = useState(null);
  
  // Initial learning path data structure with useState for state management
  const [learningPathsData, setLearningPathsData] = useState({
    generalTalk: [
      { 
        id: 1, 
        title: "Communication Fundamentals", 
        duration: "2 weeks", 
        levels: [
          { id: 1, name: "Basic Concepts", completed: false },
          { id: 2, name: "Active Listening", completed: false },
          { id: 3, name: "Non-verbal Communication", completed: false },
          { id: 4, name: "Feedback Techniques", completed: false }
        ]
      },
    ],
    interview: [
      { 
        id: 1, 
        title: "Technical Interview Preparation", 
        duration: "4 weeks", 
        levels: [
          { id: 1, name: "Algorithm Basics", completed: false },
          { id: 2, name: "Data Structures", completed: false },
          { id: 3, name: "System Design", completed: false },
          { id: 4, name: "Code Optimization", completed: false }
        ]
      },
    ],
    salaryNegotiation: [
      { 
        id: 1, 
        title: "Market Research Strategies", 
        duration: "1 week", 
        levels: [
          { id: 1, name: "Industry Standards", completed: false },
          { id: 2, name: "Company Research", completed: false },
          { id: 3, name: "Competitor Analysis", completed: false }
        ]
      },
    ]
  });

  // Calculate progress based on completed levels
  const calculateProgress = (levels) => {
    if (!levels || levels.length === 0) return 0;
    const completedCount = levels.filter(level => level.completed).length;
    return Math.round((completedCount / levels.length) * 100);
  };

  // Update level completion status
  const toggleLevelCompletion = (categoryKey, pathIndex, levelIndex) => {
    setLearningPathsData(prevData => {
      // Create a deep copy of the state
      const updatedData = JSON.parse(JSON.stringify(prevData));
      // Toggle the completion status of the specified level
      const currentLevel = updatedData[categoryKey][pathIndex].levels[levelIndex];
      currentLevel.completed = !currentLevel.completed;
      return updatedData;
    });
  };

  // Handle continue button click - modified to handle different categories
  const handleContinueClick = (category, pathId) => {
    if (category === 'interview') {
      // For interview category, show the interview-specific modal
      setCurrentPathId(pathId);
      setShowInterviewModal(true);
    } else {
      // For other categories, show an alert that the page is not ready
      alert('This feature is coming soon!');
    }
  };

  // Handle modal next button click
  const handleInterviewStart = () => {
    if (jobTitle.trim() === '' || jobDescription.trim() === '') {
      alert('Please fill in both fields');
      return;
    }

    // Store the interview data
    const interviewData = {
      role: jobTitle,
      jobDescription: jobDescription
    };
    
    localStorage.setItem('interviewData', JSON.stringify(interviewData));
    
    // Close modal
    setShowInterviewModal(false);
    
    // Navigate to the chatbot page
    navigate('/chatbot', { state: interviewData });
  };

  // Category descriptions
  const categoryDescriptions = {
    generalTalk: "Effective communication is essential in both personal and professional settings. This category focuses on developing core communication skills including active listening, clear articulation, non-verbal cues, and public speaking techniques. Master these fundamentals to express your ideas confidently and connect with your audience in any situation.",
    interview: "Technical and behavioral interviews require specific preparation strategies. This category helps you understand interview formats, practice common questions, and develop frameworks for showcasing your skills effectively. Learn techniques to communicate your experience clearly and handle challenging scenarios with confidence.",
    salaryNegotiation: "Negotiating compensation requires research, strategy, and confidence. This category covers market research techniques, value proposition development, and effective negotiation tactics. Learn how to articulate your worth, respond to counteroffers, and secure a comprehensive package that reflects your true value."
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveCategory(null);
  };

  const toggleCategory = (category) => {
    setActiveCategory(activeCategory === category ? null : category);
  };

  const renderLearningPath = (category) => (
    <div className="learning-path-content">
      <h3>Learning Path</h3>
      <div className="learning-path-items">
        {learningPathsData[category].map((path, pathIndex) => {
          const progress = calculateProgress(path.levels);
          
          return (
            <div className="learning-path-item" key={path.id}>
              <div className="path-title">{path.title}</div>
              <div className="path-details">
                <span>Duration: {path.duration}</span>
                <span className="progress-text">{progress}% Complete</span>
              </div>
              
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
              
              <div className="level-checklist">
                {path.levels.map((level, levelIndex) => (
                  <div className="level-item" key={level.id}>
                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={level.completed} 
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleLevelCompletion(category, pathIndex, levelIndex);
                        }}
                      />
                      <span className="checkmark"></span>
                      <span className="level-name">{level.name}</span>
                    </label>
                  </div>
                ))}
              </div>
              
              <button 
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinueClick(category, path.id);
                }}
              >
                Continue
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCategoryDescription = (category) => (
    <div className="interviews-content">
      <h3>About This Category</h3>
      <div className="category-description">
        <p>{categoryDescriptions[category]}</p>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <>
      <section className="welcome-section">
        <h1>Hey, There!</h1>
        <p className="subtitle">Choose a category to continue your learning journey.</p>
      </section>
      
      <section className="categories-section">
        <div className="category-card" onClick={() => toggleCategory('generalTalk')}>
          <h2>General Talk</h2>
          <p>Improve your communication skills for everyday situations</p>
          <div className="card-footer">
            <button className="btn btn-text">View Details</button>
          </div>
          
          {activeCategory === 'generalTalk' && (
            <div className="category-expanded">
              <div className="category-tabs">
                <div className="tab active">Learning Path</div> 
              </div>
              
              <div className="category-content">
                {renderLearningPath('generalTalk')}
                {renderCategoryDescription('generalTalk')}
              </div>
            </div>
          )}
        </div>
        
        <div className="category-card" onClick={() => toggleCategory('interview')}>
          <h2>Interview</h2>
          <p>Prepare for technical and behavioral interviews</p>
          <div className="card-footer">
            <button className="btn btn-text">View Details</button>
          </div>
          
          {activeCategory === 'interview' && (
            <div className="category-expanded">
              <div className="category-tabs">
                <div className="tab active">Learning Path</div>
              </div>
              
              <div className="category-content">
                {renderLearningPath('interview')}
                {renderCategoryDescription('interview')}
              </div>
            </div>
          )}
        </div>
        
        <div className="category-card" onClick={() => toggleCategory('salaryNegotiation')}>
          <h2>Salary Negotiation</h2>
          <p>Learn effective strategies for compensation discussions</p>
          <div className="card-footer">
            <button className="btn btn-text">View Details</button>
          </div>
          
          {activeCategory === 'salaryNegotiation' && (
            <div className="category-expanded">
              <div className="category-tabs">
                <div className="tab active">Learning Path</div>
              </div>
              
              <div className="category-content">
                {renderLearningPath('salaryNegotiation')}
                {renderCategoryDescription('salaryNegotiation')}
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Interview Modal */}
      {showInterviewModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Job Details</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowInterviewModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="jobTitle">Job Title</label>
                <input
                  type="text"
                  id="jobTitle"
                  placeholder="E.g. Software Engineer, Product Manager"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  style={{ textAlign: 'left' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="jobDescription">Job Description</label>
                <textarea
                  id="jobDescription"
                  placeholder="Paste the job description here"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows="4"
                  style={{ textAlign: 'left' }}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowInterviewModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleInterviewStart}
              >
                Start Practice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderUserProfile = () => (
    <div className="placeholder-content">
      <h1>User Profile</h1>
      <p>Your profile information and settings would appear here.</p>
    </div>
  );

  return (
    <div className="container">
      <header>
        <div className="logo">VORA</div>
        <div className="nav-buttons">
          <button 
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleTabChange('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`btn ${activeTab === 'userProfile' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleTabChange('userProfile')}
          >
            User Profile
          </button>
        </div>
      </header>
      
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'userProfile' && renderUserProfile()}
    </div>
  );
};

export default Dashboard;