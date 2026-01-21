// src/components/UserProfileModal.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UserProfileModal.css";

// const API_BASE = "http://localhost:3000";
const API_BASE = 'https://synhack-dep.onrender.com';

function UserProfileModal({ onClose, token }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [questionsPosted, setQuestionsPosted] = useState([]);
  const [questionsAnswered, setQuestionsAnswered] = useState([]);
  const [questionTitlesMap, setQuestionTitlesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch user info
        const userResponse = await axios.get(`${API_BASE}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userResponse.data.user);

        // Fetch user's questions
        const questionsResponse = await axios.get(`${API_BASE}/questions/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestionsPosted(questionsResponse.data.questions || []);

        // Fetch user's architecture submissions (answers)
        const answersResponse = await axios.get(`${API_BASE}/user/answers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const answers = answersResponse.data.answers || [];
        setQuestionsAnswered(answers);

        // Fetch question titles for each answered question
        const uniqueQuestionIds = [...new Set(answers.map(a => a.questionId).filter(Boolean))];
        const titlesMap = {};
        
        await Promise.all(
          uniqueQuestionIds.map(async (questionId) => {
            try {
              const questionResponse = await axios.get(`${API_BASE}/questions/${questionId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (questionResponse.data.question) {
                titlesMap[questionId] = questionResponse.data.question.qtitle;
              }
            } catch (err) {
              console.error(`Error fetching question ${questionId}:`, err);
              // Keep the fallback title if fetch fails
            }
          })
        );
        
        setQuestionTitlesMap(titlesMap);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile");
        setLoading(false);
      }
    };

    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-profile-header">
          <h2>Profile</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className="profile-loading">
            <div className="loader"></div>
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="profile-error">
            <p>{error}</p>
          </div>
        ) : (
          <div className="profile-content">
            {/* User Info Section */}
            <div className="profile-user-info">
              <div className="profile-avatar-large">
                {getInitials(user?.name)}
              </div>
              <div className="profile-user-details">
                <h3>{user?.name || "User"}</h3>
                <p className="profile-email">{user?.email || ""}</p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="profile-stats">
              <div className="stat-card">
                <div className="stat-number">{questionsPosted.length}</div>
                <div className="stat-label">Questions Posted</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{questionsAnswered.length}</div>
                <div className="stat-label">Questions Answered</div>
              </div>
            </div>

            {/* Questions Posted Section */}
            <div className="profile-section">
              <h4 className="profile-section-title">Questions Posted</h4>
              {questionsPosted.length === 0 ? (
                <p className="profile-empty">No questions posted yet</p>
              ) : (
                <div className="profile-questions-list">
                  {questionsPosted.map((question) => (
                    <div 
                      key={question._id} 
                      className="profile-question-item"
                      onClick={() => {
                        onClose();
                        navigate(`/question/${question._id}`);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <h5 className="question-item-title">{question.qtitle}</h5>
                      <p className="question-item-date">
                        {new Date(question.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Questions Answered Section */}
            <div className="profile-section">
              <h4 className="profile-section-title">Questions Answered</h4>
              {questionsAnswered.length === 0 ? (
                <p className="profile-empty">No questions answered yet</p>
              ) : (
                <div className="profile-questions-list">
                  {questionsAnswered.map((answer) => (
                    <div 
                      key={answer._id || answer.questionId} 
                      className="profile-question-item"
                      onClick={() => {
                        if (answer.questionId) {
                          onClose();
                          navigate(`/question/${answer.questionId}`);
                        }
                      }}
                      style={{ cursor: answer.questionId ? 'pointer' : 'default' }}
                    >
                      <h5 className="question-item-title">
                        {questionTitlesMap[answer.questionId] || answer.questionTitle || answer.architectureName || `Question ${answer.questionId}`}
                      </h5>
                      <p className="question-item-date">
                        {answer.submittedAt
                          ? new Date(answer.submittedAt).toLocaleDateString()
                          : "Recently answered"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfileModal;

