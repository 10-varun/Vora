import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Send, Home, ArrowLeft, Menu, X, Settings, Moon, Sun, Bell, Search, User, MessageSquare, Volume2, VolumeX, Play, Pause, CheckSquare } from "lucide-react";
import "./ChatbotInt.css";

const Chatbot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([
    { text: "Hello! Welcome to your Interview. Are you nervous? Tell us a bit about yourself", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState("chat");
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [completedLevels, setCompletedLevels] = useState({
    "Algorithm Basics": false,
    "Data Structures": false,
    "System Design": false,
    "Code Optimization": false
  });
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  // Mock navigation history
  const [navHistory, setNavHistory] = useState([
    { id: "home", name: "Home" },
    { id: "chat", name: "Chat Assistant" }
  ]);

  // Toggle play/pause function for audio
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {
          console.error("Audio playback failed:", e);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);
    setInput("");
  
    // Show typing indicator
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: "", sender: "bot", isTyping: true }
    ]);
  
    try {
      // Create a simplified request body with just the prompt
      const requestBody = {
        prompt: input
      };
  
      const response = await fetch("http://localhost:8000/process-interview-prompt/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
  
      const data = await response.json();
      const botResponse = data.reply || "I'm still learning!";
  
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages.pop(); // Remove typing indicator
        const newMessages = [...updatedMessages, { text: botResponse, sender: "bot" }];
        
        // After adding the new message, analyze the full conversation
        analyzeConversation(newMessages);
        
        return newMessages;
      });

      // Generate and play audio for the bot response if not muted
      if (!isMuted) {
        generateAndPlayAudio(botResponse);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages.pop(); // Remove typing indicator
        return [...updatedMessages, { text: "Error retrieving response!", sender: "bot" }];
      });
    }
  
    inputRef.current.focus();
  };

  const generateAndPlayAudio = async (text) => {
    try {
      const requestBody = {
        text: text,
        voice_id: "JBFqnCBsd6RMkjVDRZzb", // Default voice ID
        model_id: "eleven_multilingual_v2" // Default model ID
      };

      const response = await fetch("http://localhost:8000/generate-speech/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Speech generation failed: ${response.status}`);
      }

      // Create a blob from the audio response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(e => {
          console.error("Audio playback failed:", e);
        });
        setIsPlaying(true); // Update playing state when audio starts
      }
    } catch (error) {
      console.error("Error generating or playing audio:", error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const navigateBack = () => {
    if (navHistory.length > 1) {
      const newHistory = [...navHistory];
      newHistory.pop();
      setNavHistory(newHistory);
      setActiveSection(newHistory[newHistory.length - 1]?.id || "home");
    } else {
      navigate("/");
    }
  };

  const toggleNav = () => {
    setIsNavExpanded(!isNavExpanded);
  };

  const handleEndInterview = async () => {
    // Do a final analysis of the conversation before showing confirmation
    analyzeConversation(messages);
    setShowEndConfirmation(true);
  };

  // Function to analyze conversation content and mark appropriate levels as completed
  const analyzeConversation = (messageList) => {
    const allText = messageList
      .map(msg => msg.text.toLowerCase())
      .join(" ");
    
    // Check for keywords related to each level
    const newCompletedLevels = { ...completedLevels };
    
    // Algorithm Basics keywords
    if (
      allText.includes("algorithm") || 
      allText.includes("time complexity") || 
      allText.includes("space complexity") || 
      allText.includes("big o") ||
      allText.includes("sorting") ||
      allText.includes("searching")
    ) {
      newCompletedLevels["Algorithm Basics"] = true;
    }
    
    // Data Structures keywords
    if (
      allText.includes("data structure") || 
      allText.includes("array") || 
      allText.includes("linked list") || 
      allText.includes("tree") ||
      allText.includes("hash map") ||
      allText.includes("graph") ||
      allText.includes("queue") ||
      allText.includes("stack")
    ) {
      newCompletedLevels["Data Structures"] = true;
    }
    
    // System Design keywords
    if (
      allText.includes("system design") || 
      allText.includes("architecture") || 
      allText.includes("distributed system") || 
      allText.includes("scalability") ||
      allText.includes("database") ||
      allText.includes("microservice") ||
      allText.includes("api design")
    ) {
      newCompletedLevels["System Design"] = true;
    }
    
    // Code Optimization keywords
    if (
      allText.includes("optimization") || 
      allText.includes("refactor") || 
      allText.includes("performance") || 
      allText.includes("efficient") ||
      allText.includes("memory usage") ||
      allText.includes("benchmark") ||
      allText.includes("profiling")
    ) {
      newCompletedLevels["Code Optimization"] = true;
    }
    
    setCompletedLevels(newCompletedLevels);
    
    // Return true if at least one level was completed
    return Object.values(newCompletedLevels).some(value => value === true);
  };

  const confirmEndInterview = async () => {
    setIsInterviewComplete(true);
    setShowEndConfirmation(false);
    
    // Calculate how many levels were completed
    const completedCount = Object.values(completedLevels).filter(value => value === true).length;
    
    // Add a completion message from the bot
    let completionMessage = "Interview complete! ";
    
    if (completedCount === 4) {
      completionMessage += "Great job! You've covered all topics in the Technical Interview Preparation path: Algorithm Basics, Data Structures, System Design, and Code Optimization.";
    } else if (completedCount > 0) {
      const completedTopics = Object.entries(completedLevels)
        .filter(([_, isCompleted]) => isCompleted)
        .map(([topic, _]) => topic)
        .join(", ");
      
      completionMessage += `You've completed ${completedCount} of 4 topics in the Technical Interview Preparation path: ${completedTopics}.`;
    } else {
      completionMessage += "You didn't specifically cover any of the core technical interview topics in depth. Consider practicing with more technical questions next time.";
    }
    
    setMessages((prevMessages) => [
      ...prevMessages, 
      { text: completionMessage, sender: "bot" }
    ]);
    
    try {
      // Update the learning path progress in localStorage
      const learningPathsData = JSON.parse(localStorage.getItem('learningPathsData') || '{}');
      
      // Find and update the Technical Interview Preparation path
      if (learningPathsData.interview) {
        learningPathsData.interview.forEach(path => {
          if (path.title === "Technical Interview Preparation") {
            path.levels.forEach(level => {
              // Update completion status based on our analysis
              if (level.name === "Algorithm Basics") {
                level.completed = completedLevels["Algorithm Basics"];
              } else if (level.name === "Data Structures") {
                level.completed = completedLevels["Data Structures"];
              } else if (level.name === "System Design") {
                level.completed = completedLevels["System Design"];
              } else if (level.name === "Code Optimization") {
                level.completed = completedLevels["Code Optimization"];
              }
            });
          }
        });
        
        localStorage.setItem('learningPathsData', JSON.stringify(learningPathsData));
      }
    } catch (error) {
      console.error("Error updating learning path:", error);
    }
  };

  const cancelEndInterview = () => {
    setShowEndConfirmation(false);
  };

  // Function to render message text with proper line breaks for bullet points
  const renderMessageText = (text) => {
    if (!text) return null;
    
    // Split the text by newlines
    const lines = text.split('\n');
    
    // Find the first bullet point index
    const firstBulletIndex = lines.findIndex(line => line.trim().startsWith('•'));
    
    return (
      <div className="message-text-wrapper">
        {lines.map((line, i) => {
          // Check if this is a bullet point line
          const isBullet = line.trim().startsWith('•');
          const isFirstBullet = isBullet && i === firstBulletIndex;
          const isEmptyBullet = line.trim() === '•' || line.trim() === '• ';
          
          // Skip empty bullet points completely
          if (isEmptyBullet) {
            return null;
          }
          
          // For the first bullet point, remove the bullet character
          let displayLine = line;
          if (isFirstBullet) {
            displayLine = line.replace(/^(\s*)(•)(\s*)/, '$1$3');
          }
          
          return (
            <React.Fragment key={i}>
              {isBullet ? 
                <div className={`bullet-point-line ${isFirstBullet ? 'first-point-no-bullet' : ''}`}>
                  {displayLine}
                </div> : 
                <div className="regular-line">{line}</div>}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  // Effect to generate audio for the initial bot message when component mounts
  useEffect(() => {
    if (messages.length > 0 && messages[0].sender === "bot" && !isMuted) {
      generateAndPlayAudio(messages[0].text);
    }
  }, []);

  // Add listeners for audio events to update play state
  useEffect(() => {
    const audioElement = audioRef.current;
    
    if (audioElement) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);
      
      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('pause', handlePause);
      audioElement.addEventListener('ended', handleEnded);
      
      return () => {
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('pause', handlePause);
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  // Get job information from location state or localStorage
  useEffect(() => {
    try {
      // Try to get interview context from location state
      if (location.state?.role) {
        // We have interview context, could update UI here
        console.log("Interview context:", location.state);
      } else {
        // Try to get from localStorage as fallback
        const storedData = localStorage.getItem('interviewData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log("Retrieved interview context from localStorage:", parsedData);
        }
      }
    } catch (error) {
      console.error("Error retrieving interview context:", error);
    }
  }, [location]);

  return (
    <div className={`app-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Audio element for playing speech */}
      <audio ref={audioRef} className="hidden-audio" />
      
      {/* Modern Navbar */}
      <nav className="app-navbar">
        <div className="navbar-main">
          <div className="navbar-left">
            <button className="nav-button icon-button" onClick={toggleNav}>
              {isNavExpanded ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="breadcrumb-navigation">
              {navHistory.length > 1 && (
                <button className="nav-button back-button" onClick={() => navigate("/dashboard")}>
                <ArrowLeft size={18} />
              </button>
              )}
              <div className="breadcrumb-trail">
                {navHistory.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <span className="breadcrumb-separator">/</span>}
                    <span className={`breadcrumb-item ${index === navHistory.length - 1 ? 'active' : ''}`}>
                      {item.name}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          
          <div className="navbar-center">
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Search messages..." className="search-input" />
            </div>
          </div>
          
          <div className="navbar-right">
            {/* New play/pause button */}
            <button className="nav-button icon-button" onClick={togglePlayPause}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button className="nav-button icon-button" onClick={toggleMute}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button className="nav-button icon-button" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="nav-button icon-button notification-button">
              <Bell size={20} />
              <span className="notification-badge">2</span>
            </button>
            <div className="user-profile">
              <div className="avatar">
                <User size={20} />
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Side Navigation */}
      <div className={`side-navigation ${isNavExpanded ? 'expanded' : ''}`}>
        <div className="nav-header">
          <h3>Chatbot Hub</h3>
        </div>
        <div className="nav-links">
          <button className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}>
            <Home size={20} />
            <span>Home</span>
          </button>
          <button className={`nav-link ${activeSection === 'chat' ? 'active' : ''}`}>
            <MessageSquare size={20} />
            <span>Chat Assistant</span>
          </button>
          <button className="nav-link">
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
        
        {/* New Progress Tracking Panel */}
        <div className="progress-panel">
          <h4>Interview Progress</h4>
          <div className="level-tracking">
            {Object.entries(completedLevels).map(([level, isCompleted]) => (
              <div key={level} className={`level-item ${isCompleted ? 'completed' : ''}`}>
                <span className="level-indicator">{isCompleted ? '✓' : '○'}</span>
                <span className="level-name">{level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Chat Container */}
      <div className="chat-container">
        <div className="chat-header">
          <h2 className="chat-title">Technical Interview Practice</h2>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span className="status-text">Online</span>
          </div>
        </div>
        
        <div className="chat-box" ref={chatBoxRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender} ${msg.isTyping ? "typing" : ""}`}>
              {msg.isTyping ? (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              ) : (
                <div className="message-content">
                  {renderMessageText(msg.text)}
                </div>
              )}
              <div className="message-time">
                {!msg.isTyping && new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="input-container">
          <button 
            onClick={handleEndInterview} 
            className="send-button"
            disabled={isInterviewComplete}
            title="End Interview"
          >
            <CheckSquare size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="chat-input"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            ref={inputRef}
            disabled={isInterviewComplete}
          />
          <button 
            onClick={sendMessage} 
            className="send-button"
            disabled={!input.trim() || isInterviewComplete}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      
      {isNavExpanded && <div className="nav-overlay" onClick={toggleNav}></div>}
      
      {/* End Interview Confirmation Modal */}
      {showEndConfirmation && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>End Interview?</h3>
              <button 
                className="modal-close-btn"
                onClick={cancelEndInterview}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to end this interview?</p>
              
              {Object.values(completedLevels).some(val => val) ? (
                <div className="completion-summary">
                  <p>Based on your conversation, you've covered:</p>
                  <ul>
                    {Object.entries(completedLevels).map(([level, isCompleted]) => (
                      <li key={level} className={isCompleted ? 'completed-topic' : 'incomplete-topic'}>
                        {level}: {isCompleted ? 'Completed' : 'Not covered'}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No specific technical topics were detected in your conversation. Consider discussing algorithms, data structures, system design, or code optimization to make progress.</p>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={cancelEndInterview}
              >
                Continue Interview
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmEndInterview}
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;