import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Sidebar.css';

const API_BASE = 'http://localhost:3000';

const Sidebar = ({ selectedNode, selectedEdge, onDeleteNode, onDeleteEdge, previewedSubtype, onQuestionClick }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('questions'); // 'details' or 'questions'
  const [myQuestions, setMyQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Fetch user's questions
  useEffect(() => {
    const fetchMyQuestions = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        setLoadingQuestions(true);
        const response = await axios.get(`${API_BASE}/questions/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyQuestions(response.data.questions || []);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        setMyQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    // Always fetch questions when component mounts or when switching to questions view
    if (viewMode === 'questions') {
      fetchMyQuestions();
    }
  }, [viewMode]);

  // Auto-switch to questions view when no component/edge is selected
  useEffect(() => {
    if (!selectedNode && !selectedEdge && !previewedSubtype) {
      // Always show questions when nothing is selected
      setViewMode('questions');
    }
    // Note: When a component/edge is selected, we show details by default
    // but user can manually click "Questions" button to switch to questions view
  }, [selectedNode, selectedEdge, previewedSubtype]);

  // If a preview is active, prefer it — this ensures heuristics from the palette
  // are immediately visible even if a canvas node was previously selected.
  const isPreviewActive = !!previewedSubtype;
  const previewNode = previewedSubtype ? {
    id: `preview-${previewedSubtype.componentType}-${previewedSubtype.subtype.id || previewedSubtype.subtype.name}`,
    data: {
      label: previewedSubtype.subtype.label || previewedSubtype.subtype.name,
      heuristics: previewedSubtype.subtype.heuristics || '',
      componentType: previewedSubtype.componentType,
      properties: { subtype: previewedSubtype.subtype.id || previewedSubtype.subtype.name },
    }
  } : null;

  const effectiveNode = isPreviewActive ? previewNode : selectedNode || null;

  // Show questions view
  if (viewMode === 'questions') {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>My Questions</h3>
        </div>
        <div className="sidebar-content">
          {loadingQuestions ? (
            <div className="sidebar-empty">
              <p>Loading questions...</p>
            </div>
          ) : myQuestions.length === 0 ? (
            <div className="sidebar-empty">
              <p>📝 No questions posted yet</p>
            </div>
          ) : (
            <div className="questions-list">
              {myQuestions.map((q) => (
                <div
                  key={q._id}
                  className="question-item"
                  onClick={() => {
                    if (onQuestionClick) {
                      onQuestionClick(q._id);
                    } else {
                      navigate(`/question/${q._id}`);
                    }
                  }}
                >
                  <div className="question-item-content">
                    <h4 className="question-title">{q.qtitle}</h4>
                    <small className="question-date">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  <span className="question-arrow">→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }


  if (effectiveNode) {
    const node = effectiveNode;
    const heuristics = node.data?.heuristics;
    const props = node.data?.properties || {};

    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Component Details</h3>
          <button
            className="toggle-btn"
            onClick={() => setViewMode('questions')}
            style={{ marginLeft: 'auto' }}
          >
            Questions
          </button>
        </div>
        <div className="sidebar-content">
          <div className="detail-section">
            <label>Name:</label>
            <div className="detail-value">{node.data.label}</div>
          </div>
          <div className="detail-section">
            <label>Type:</label>
            <div className="detail-value badge">{node.data.componentType}</div>
          </div>
          <div className="detail-section">
            <label>ID:</label>
            <div className="detail-value code">{node.data.componentId || 'preview'}</div>
          </div>

          {heuristics && typeof heuristics === 'object' && heuristics.scores && (
            <div className="detail-section">
              <label>Heuristics:</label>
              <div className="heuristics-grid">
                {Object.entries(heuristics.scores || {}).map(([key, value]) => (
                  <div key={key} className="heuristic-item">
                    <span className="heuristic-name">{key.replace('_', ' ')}</span>
                    <div className="heuristic-bar">
                      <div
                        className="heuristic-fill"
                        style={{ width: `${(value / 10) * 100}%` }}
                      />
                    </div>
                    <span className="heuristic-value">{Number(value).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {heuristics && typeof heuristics === 'string' && (
            <div className="detail-section">
              <label>Heuristics:</label>
              <div className="heuristics-text">{heuristics}</div>
            </div>
          )}

          {props && Object.keys(props).length > 0 && (
            <div className="detail-section">
              <label>Properties:</label>
              <div className="properties-list">
                {Object.entries(props).map(([key, value]) => (
                  <div key={key} className="property-item">
                    <span className="property-key">{key}:</span>
                    <span className="property-value">{JSON.stringify(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Always show heuristics for preview nodes (even if empty) with a helpful fallback message */}
          {isPreviewActive && (
            <div className="detail-section">
              <label>Heuristics:</label>
              {heuristics && typeof heuristics === 'object' && heuristics.scores ? (
                <div className="heuristics-grid">
                  {Object.entries(heuristics.scores || {}).map(([key, value]) => (
                    <div key={key} className="heuristic-item">
                      <span className="heuristic-name">{key.replace('_', ' ')}</span>
                      <div className="heuristic-bar">
                        <div
                          className="heuristic-fill"
                          style={{ width: `${(value / 10) * 100}%` }}
                        />
                      </div>
                      <span className="heuristic-value">{Number(value).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              ) : heuristics && typeof heuristics === 'string' ? (
                <div className="heuristics-text">{heuristics}</div>
              ) : (
                <div className="heuristics-text">No heuristics available for this subtype.</div>
              )}
            </div>
          )}
        </div>
        <div className="sidebar-actions">
          {!isPreviewActive && (
            <button
              className="btn btn-danger btn-block"
              onClick={() => onDeleteNode(node.id)}
            >
              🗑️ Delete Component
            </button>
          )}
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    const edge = selectedEdge;
    const eHeur = edge.data?.heuristics;
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Connection Details</h3>
          <button
            className="toggle-btn"
            onClick={() => setViewMode('questions')}
            style={{ marginLeft: 'auto' }}
          >
            Questions
          </button>
        </div>
        <div className="sidebar-content">
          <div className="detail-section">
            <label>Link Type:</label>
            <div className="detail-value badge">{edge.data?.linkType || 'Unknown'}</div>
          </div>
          <div className="detail-section">
            <label>ID:</label>
            <div className="detail-value code">{edge.data?.linkId || edge.id}</div>
          </div>

          {eHeur && typeof eHeur === 'object' && eHeur.scores && (
            <div className="detail-section">
              <label>Link Heuristics:</label>
              <div className="heuristics-grid">
                {Object.entries(eHeur.scores || {}).map(([key, value]) => (
                  <div key={key} className="heuristic-item">
                    <span className="heuristic-name">{key.replace('_', ' ')}</span>
                    <div className="heuristic-bar">
                      <div
                        className="heuristic-fill"
                        style={{ width: `${(value / 10) * 100}%` }}
                      />
                    </div>
                    <span className="heuristic-value">{Number(value).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eHeur && typeof eHeur === 'string' && (
            <div className="detail-section">
              <label>Link Heuristics:</label>
              <div className="heuristics-text">{eHeur}</div>
            </div>
          )}
        </div>
        <div className="sidebar-actions">
          <button
            className="btn btn-danger btn-block"
            onClick={() => onDeleteEdge(edge.id)}
          >
            🗑️ Delete Connection
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default Sidebar;
