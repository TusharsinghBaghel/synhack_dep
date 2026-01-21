import React, { useState, useEffect, useCallback } from 'react';
import { architectureAPI } from '../api';
import './SolutionsViewer.css';

const SolutionsViewer = ({ questionId, onLoadSolution }) => {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSolutions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await architectureAPI.getByQuestion(questionId);
      // Filter only submitted solutions
      const submittedSolutions = response.data.filter(arch => arch.submitted);
      setSolutions(submittedSolutions);
    } catch (error) {
      console.error('Failed to load solutions:', error);
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    if (questionId) {
      loadSolutions();
    }
  }, [questionId, loadSolutions]);

  const handleLoadSolutionToCanvas = async (solution) => {
    if (onLoadSolution) {
      onLoadSolution(solution.id, solution.name);
    }
  };

  if (loading) {
    return (
      <div className="solutions-viewer">
        <div className="solutions-loading">Loading solutions...</div>
      </div>
    );
  }

  if (solutions.length === 0) {
    return (
      <div className="solutions-viewer">
        <div className="solutions-empty">
          <p>No solutions submitted yet for this question.</p>
          <p className="solutions-hint">Be the first to submit a solution!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="solutions-viewer">
      <div className="solutions-header">
        <h3>Submitted Solutions ({solutions.length})</h3>
        <button className="refresh-button" onClick={loadSolutions}>
          🔄 Refresh
        </button>
      </div>

      <div className="solutions-list">
        {solutions.map((solution) => (
          <div key={solution.id} className="solution-card">
            <div className="solution-info">
              <h4>{solution.name}</h4>
              <div className="solution-meta">
                <span className="solution-components">
                  📦 {solution.components?.length || 0} components
                </span>
                <span className="solution-links">
                  🔗 {solution.links?.length || 0} links
                </span>
              </div>
              <div className="solution-timestamp">
                Submitted: {new Date(solution.updatedAt).toLocaleString()}
              </div>
            </div>
            <div className="solution-actions">
              <button
                className="load-button"
                onClick={() => handleLoadSolutionToCanvas(solution)}
              >
                Load to Canvas
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SolutionsViewer;

