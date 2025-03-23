import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Home, ArrowLeft, Menu, X, Settings, Moon, Sun, Bell, Search, User, MessageSquare, Volume2, VolumeX } from "lucide-react";
import "./ChatbotInt.css";

const Chatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { text: "Hello! Welcome to your Interview. Are you nervous? Tell us a bit about yourself", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState("chat");
  const [isMuted, setIsMuted] = useState(false);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  // Mock navigation history
  const [navHistory, setNavHistory] = useState([
    { id: "home", name: "Home" },
    { id: "chat", name: "Chat Assistant" }
  ]);

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
        return [...updatedMessages, { text: botResponse, sender: "bot" }];
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
      }
    } catch (error) {
      console.error("Error generating or playing audio:", error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.pause();
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
      </div>
      
      {/* Chat Container */}
      <div className="chat-container">
        <div className="chat-header">
          <h2 className="chat-title">Ask AI Anything</h2>
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
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="chat-input"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            ref={inputRef}
          />
          <button 
            onClick={sendMessage} 
            className="send-button"
            disabled={!input.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      
      {isNavExpanded && <div className="nav-overlay" onClick={toggleNav}></div>}
    </div>
  );
};

export default Chatbot;