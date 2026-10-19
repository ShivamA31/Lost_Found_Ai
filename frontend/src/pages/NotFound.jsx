import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-beige font-inter flex flex-col items-center justify-center p-8 text-center">
      <img
        src="/images/search-pool-ladder.png"
        alt="Lost illustration"
        className="w-64 h-auto object-contain mb-8"
      />
      <div className="font-oswald text-8xl text-brand-red mb-2">404</div>
      <h1 className="font-oswald text-3xl mb-2">Page Not Found</h1>
      <p className="text-muted-text mb-8 max-w-sm">
        The page you're looking for doesn't exist. Maybe it got lost too?
      </p>
      <Link to="/" className="bg-ink-black text-white px-8 py-3 rounded-full font-medium hover:bg-black transition-colors">
        Back to Home
      </Link>
    </div>
  );
}
