import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Home, ArrowLeft, Menu, X, Settings, Moon, Sun, Bell, Search, User, MessageSquare } from "lucide-react";
import "./ChatbotInt.css";

const Chatbot = () => {
  const navigate = useNavigate(); // ✅ Correctly placed useNavigate at the top
  const [messages, setMessages] = useState([
    { text: "Hello! How can I assist you today?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState("chat");
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  // Mock navigation history
  const [navHistory, setNavHistory] = useState([
    { id: "home", name: "Home" },
    { id: "chat", name: "Chat Assistant" }
  ]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);
    setInput("");

    // Simulate bot response with loading
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: "", sender: "bot", isTyping: true }
    ]);

    setTimeout(() => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages.pop(); // Remove typing indicator
        return [...updatedMessages, { text: "I'm still learning!", sender: "bot" }];
      });
    }, 1500);
    
    // Focus input after sending
    inputRef.current.focus();
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
      navigate("/"); // ✅ Redirects to main page
    }
  };

  const toggleNav = () => {
    setIsNavExpanded(!isNavExpanded);
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className={`app-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Modern Navbar */}
      <nav className="app-navbar">
        <div className="navbar-main">
          <div className="navbar-left">
            <button className="nav-button icon-button" onClick={toggleNav}>
              {isNavExpanded ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="breadcrumb-navigation">
              {navHistory.length > 1 && (
                <button className="nav-button back-button" onClick={() => navigate("/")}>
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
                <span>{msg.text}</span>
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
            onKeyDown={(e) => e.key === "Enter" && sendMessage()} // ✅ Fixed key event
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
