import React, { useEffect, useState } from 'react';

// state can be: 'loading', 'empty', 'error', '404'
export default function SearchStatus({ state, onAction }) {
  const [showLoading, setShowLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (state === 'loading') {
      setShowLoading(true);
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 5 : p));
      }, 50);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setShowLoading(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [state]);

  if (state !== 'loading' && !showLoading && state !== 'empty' && state !== 'error' && state !== '404') {
    return null;
  }

  const isComplete = state !== 'loading' && !showLoading;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative w-full max-w-md">
        <img 
          src="/images/search-pool-ladder.png" 
          alt="Illustration of a pool and ladder" 
          className="w-full h-auto object-contain mb-8 mix-blend-multiply"
        />
        
        {(!isComplete || state === 'loading') && (
          <div className="w-full max-w-xs mx-auto">
            <div className="text-muted-text font-inter text-sm mb-2 font-medium">Searching reports...</div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-red transition-all duration-200 ease-out rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {isComplete && (state === 'empty' || state === '404') && (
          <div className="animate-fade-in mt-2">
            <h1 className="font-oswald text-7xl md:text-9xl text-brand-red tracking-tight mb-4">404</h1>
            <h2 className="font-oswald text-3xl mb-2">No matching report found</h2>
            <p className="text-muted-text font-inter mb-8">
              {state === '404' ? "Page not found." : "Nothing like this has been reported yet."}
            </p>
            
            {state === 'empty' && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => onAction('lost')}
                  className="bg-ink-black text-card-white px-6 py-3 rounded-full font-inter font-medium hover:bg-black transition-colors"
                >
                  Report this as Lost
                </button>
                <button 
                  onClick={() => onAction('found')}
                  className="bg-card-white border border-gray-200 text-ink-black px-6 py-3 rounded-full font-inter font-medium hover:bg-gray-50 transition-colors"
                >
                  Report as Found
                </button>
              </div>
            )}
            
            <button 
              onClick={() => onAction('search')}
              className="mt-6 text-brand-red hover:underline font-inter font-medium"
            >
              Try another search
            </button>
          </div>
        )}

        {isComplete && state === 'error' && (
          <div className="animate-fade-in mt-4">
            <h2 className="font-oswald text-3xl mb-2">Oops, something went wrong</h2>
            <p className="text-muted-text font-inter mb-6">We couldn't connect to the server.</p>
            <button 
              onClick={() => onAction('retry')}
              className="bg-ink-black text-card-white px-6 py-3 rounded-full font-inter font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
