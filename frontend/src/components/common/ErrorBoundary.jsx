import React from 'react';

/**
 * Top-level React ErrorBoundary preventing uncaught component render errors
 * from wiping #root into a blank white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message ? String(error.message) : 'Unexpected render error',
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught UI error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4 py-12 text-[#1d1d1f]">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-[#e5e5ea] text-center space-y-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-semibold tracking-tight">
              មានបញ្ហាក្នុងការបង្ហាញទំព័រនេះ
            </h1>
            <p className="text-xs font-medium text-[#6e6e73]">
              Page display interrupted · សូមផ្ទុកទំព័រឡើងវិញ ឬត្រឡប់ទៅទំព័រដើម
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="flex-1 rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0077ed] transition-colors cursor-pointer"
            >
              ផ្ទុកឡើងវិញ / Reload
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="flex-1 rounded-full bg-[#f5f5f7] px-5 py-2.5 text-sm font-medium text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors cursor-pointer"
            >
              ទំព័រដើម / Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
