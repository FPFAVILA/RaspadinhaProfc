import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { trackPageView } from './utils/tracking';

// Utmify Pageview tracking wrapper
const AppWithTracking = () => {
  useEffect(() => {
    // Track pageview on initial load with a delay to ensure scripts are loaded
    const timer = setTimeout(() => {
      trackPageView();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppWithTracking />
    </BrowserRouter>
  </StrictMode>
);
