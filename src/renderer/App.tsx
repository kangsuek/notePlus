import React from 'react';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import MainLayout from './components/Layout/MainLayout';
import './App.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <MainLayout />
    </ErrorBoundary>
  );
};

export default App;
