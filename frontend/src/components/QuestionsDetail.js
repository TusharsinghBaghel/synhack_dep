// src/QuestionDetail.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import App from "../App"; // Import the System Design Simulator
import Navbar from "./Navbar";
import PostQuestionModal from "./PostQuestionModal";
import UserProfileModal from "./UserProfileModal";
import SolutionsViewer from "./SolutionsViewer";
import "./QuestionsDetail.css";

// const API_BASE = "http://localhost:3000";
const API_BASE = 'https://synhack-dep.onrender.com';

function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [solutionArchId, setSolutionArchId] = useState(null); // Track which solution to load
  const [loadedSolutionId, setLoadedSolutionId] = useState(null); // Track what was already loaded
  const [aiMode, setAiMode] = useState(false); // AI mode toggle state
  const token = localStorage.getItem("token");

  // Enable scrolling for this page
  useEffect(() => {
    // Override root overflow when component mounts
    const root = document.getElementById('root');
    const body = document.body;
    const html = document.documentElement;
    
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
    }
    if (body) {
      body.style.overflow = 'auto';
      body.style.height = 'auto';
    }
    if (html) {
      html.style.overflow = 'auto';
      html.style.height = 'auto';
    }

    return () => {
      // Reset on unmount (optional - you may want to keep this for other routes)
      // root.style.overflow = 'hidden';
      // root.style.height = '100vh';
    };
  }, []);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await axios.get(`${API_BASE}/questions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestion(response.data.question);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    const fetchAllQuestions = async () => {
      try {
        const response = await axios.get(`${API_BASE}/questions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions(response.data.questions || []);
      } catch (err) {
        console.error("Error fetching questions:", err);
      }
    };

    fetchQuestion();
    fetchAllQuestions();
  }, [id, token]);

  const handleRandomQuestion = () => {
    if (questions.length > 0) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      navigate(`/question/${questions[randomIndex]._id}`);
    }
  };

  const handlePostSuccess = () => {
    setShowPostModal(false);
    // Optionally refresh the questions list
    axios.get(`${API_BASE}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => {
      setQuestions(response.data.questions || []);
    }).catch(err => {
      console.error("Error refreshing questions:", err);
    });
  };

  const handleSubmitDesign = async () => {
    // TODO: Implement API endpoint to submit the architecture design
    try {
      console.log("Submit design for question:", id);
      
      // Example API call structure:
      // const response = await axios.post(
      //   `${API_BASE}/architecture/submit`,
      //   {
      //     questionId: id,
      //     architectureData: {
      //       nodes: [], // Get from App.js state
      //       edges: [], // Get from App.js state
      //     }
      //   },
      //   {
      //     headers: { Authorization: `Bearer ${token}` }
      //   }
      // );
      
      alert("Design submitted successfully! (Feature to be implemented)");
    } catch (err) {
      console.error("Error submitting design:", err);
      alert("Failed to submit design. Please try again.");
    }
  };

  const handleLoadSolution = (solutionArchId, solutionName) => {
    // Prevent loading the same solution twice
    if (loadedSolutionId === solutionArchId) {
      scrollToCanvas();
      return;
    }

    // Set the solution architecture ID to trigger loading
    setSolutionArchId(solutionArchId);
    setLoadedSolutionId(solutionArchId);

    // Scroll to canvas
    setTimeout(() => {
      scrollToCanvas();
    }, 100);
  };


  const scrollToCanvas = () => {
    const canvasSection = document.getElementById('design-canvas');
    if (canvasSection) {
      canvasSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="detail-container">
        <Navbar
          onRandomQuestion={handleRandomQuestion}
          onPostQuestion={() => setShowPostModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
        />
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading question...</p>
        </div>
        {showPostModal && (
          <PostQuestionModal
            onClose={() => setShowPostModal(false)}
            onSuccess={handlePostSuccess}
            token={token}
          />
        )}
        {showProfileModal && (
          <UserProfileModal
            onClose={() => setShowProfileModal(false)}
            token={token}
          />
        )}
      </div>
    );
  }

  if (!question) {
    return (
      <div className="detail-container">
        <Navbar
          onRandomQuestion={handleRandomQuestion}
          onPostQuestion={() => setShowPostModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
        />
        <div className="error-container">
          <h2>Question not found</h2>
          <button className="btn-back" onClick={() => navigate("/home")}>
            Back to Home
          </button>
        </div>
        {showPostModal && (
          <PostQuestionModal
            onClose={() => setShowPostModal(false)}
            onSuccess={handlePostSuccess}
            token={token}
          />
        )}
        {showProfileModal && (
          <UserProfileModal
            onClose={() => setShowProfileModal(false)}
            token={token}
          />
        )}
      </div>
    );
  }

  return (
    <div className="detail-container">
      <Navbar
        onRandomQuestion={handleRandomQuestion}
        onPostQuestion={() => setShowPostModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      <div className="detail-container-content">
        <button className="btn-back" onClick={() => navigate("/home")}>
          ← Back
        </button>

        {/* Question Details Section */}
        <div className="detail-card">
        <div className="detail-header">
          <h1>{question.qtitle}</h1>
          <div className="author-section">
            <span className="author-avatar-large">
              {question.uid?.name?.charAt(0).toUpperCase() || "U"}
            </span>
            <div>
              <p className="author-name-large">{question.uid?.name || "Unknown"}</p>
              <small className="post-date-large">
                Posted on {new Date(question.createdAt).toLocaleString()}
              </small>
            </div>
          </div>
        </div>

        {question.qimg && (
          <div className="detail-image">
            <img
              src={`${API_BASE}/uploads/${question.qimg}`}
              alt={question.qtitle}
            />
          </div>
        )}

        <div className="detail-description">
          <h3>Description</h3>
          <p>{question.qdes}</p>
        </div>

        <div className="action-prompt">
          <p>Ready to design your solution?</p>
          <button 
            className="btn-scroll-to-canvas"
            onClick={scrollToCanvas}
          >
            Start Designing Below ↓
          </button>
        </div>
      </div>

      {/* Solutions Section */}
      <div className="solutions-section">
        <SolutionsViewer
          questionId={id}
          onLoadSolution={handleLoadSolution}
        />
      </div>

      {/* Design Canvas Section */}
      <div className="canvas-section" id="design-canvas">
        <div className="canvas-header">
          <div className="canvas-title">
            <h2>Design Your Solution</h2>
            <p>Create your system architecture by dragging components onto the canvas</p>
          </div>
          {/* <button 
            className="btn-submit-design"
            onClick={handleSubmitDesign}
          >
            Submit Design
          </button> */}
        </div>

        <div className="simulator-wrapper">
          <App
            questionId={id}
            onLoadSolution={handleLoadSolution}
            solutionArchitectureId={solutionArchId}
            aiMode={aiMode}
            questionData={question}
          />
        </div>
      </div>
      </div>

      {/* Floating AI Assistive Ball */}
      <button
        className={`ai-assistive-ball ${aiMode ? 'active' : ''}`}
        onClick={() => setAiMode(!aiMode)}
        title={aiMode ? 'AI Mode ON - Click to turn OFF' : 'AI Mode OFF - Click to turn ON'}
        aria-label="Toggle AI Mode"
      >
        <span className="ai-ball-tooltip">AI Evaluation</span>
        <span className="ai-ball-icon">🤖</span>
        {aiMode && <span className="ai-ball-pulse"></span>}
      </button>

      {showPostModal && (
        <PostQuestionModal
          onClose={() => setShowPostModal(false)}
          onSuccess={handlePostSuccess}
          token={token}
        />
      )}

      {showProfileModal && (
        <UserProfileModal
          onClose={() => setShowProfileModal(false)}
          token={token}
        />
      )}
    </div>
  );
}

export default QuestionDetail;