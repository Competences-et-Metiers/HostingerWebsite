import React from 'react';
import ErrorState from './ErrorState';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Force a reload if reset doesn't work
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <ErrorState
            title="Une erreur s'est produite"
            message={
              this.state.error?.message ||
              "Une erreur inattendue s'est produite. Veuillez rafraîchir la page."
            }
            onRetry={this.handleReset}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

