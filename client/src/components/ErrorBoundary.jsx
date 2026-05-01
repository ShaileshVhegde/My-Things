import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-bgSurface border border-borderBase rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-4">
            <AlertTriangle className="text-danger" size={32} />
          </div>
          <h2 className="text-xl font-display font-bold text-textPrimary mb-2">Something went wrong</h2>
          <p className="text-textMuted text-sm mb-6 max-w-md">
            We encountered an unexpected error while loading this component. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-xl font-semibold transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
