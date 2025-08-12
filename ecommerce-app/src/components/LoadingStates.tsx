import React from 'react';
import './LoadingStates.css';

interface SkeletonCardProps {
  count?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-image skeleton-shimmer"></div>
          <div className="skeleton-content">
            <div className="skeleton-category skeleton-shimmer"></div>
            <div className="skeleton-title skeleton-shimmer"></div>
            <div className="skeleton-title-2 skeleton-shimmer"></div>
            <div className="skeleton-rating">
              <div className="skeleton-stars skeleton-shimmer"></div>
              <div className="skeleton-rating-text skeleton-shimmer"></div>
            </div>
            <div className="skeleton-description skeleton-shimmer"></div>
            <div className="skeleton-description-2 skeleton-shimmer"></div>
            <div className="skeleton-price skeleton-shimmer"></div>
            <div className="skeleton-button skeleton-shimmer"></div>
          </div>
        </div>
      ))}
    </>
  );
};

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text = 'Loading...' 
}) => {
  return (
    <div className="loading-container">
      <div className={`loading-spinner ${size}`}></div>
      <p className="loading-text">{text}</p>
    </div>
  );
};

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
  message?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  error, 
  onRetry, 
  message = 'Something went wrong' 
}) => {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h3 className="error-title">{message}</h3>
      <p className="error-message">{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-button">
          Try Again
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  message?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = 'No items found', 
  description,
  action 
}) => {
  return (
    <div className="empty-container">
      <div className="empty-icon">📦</div>
      <h3 className="empty-title">{message}</h3>
      {description && <p className="empty-description">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
};

export const EndOfListIndicator: React.FC<{ message?: string }> = ({ 
  message = "🎉 You've reached the end!" 
}) => {
  return (
    <div className="end-container">
      <p className="end-text">{message}</p>
    </div>
  );
};
