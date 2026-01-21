import React, { useEffect, useState } from 'react';
import './ToastNotification.css';

const ToastNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      setIsLeaving(false);
      
      // Auto-dismiss after delay
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration || 4000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300); // Match animation duration
  };

  if (!notification || !isVisible) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  const duration = notification.duration || 4000;

  return (
    <div 
      className={`toast-notification toast-${notification.type} ${isLeaving ? 'toast-leaving' : 'toast-entering'}`}
      onClick={handleClose}
      style={{ '--toast-duration': `${duration}ms` }}
    >
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{notification.message}</span>
        <button className="toast-close" onClick={(e) => { e.stopPropagation(); handleClose(); }} aria-label="Close">
          ×
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;

