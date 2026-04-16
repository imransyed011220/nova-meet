/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/LoginPage';
import { LoadingProvider } from './hooks/useLoading';
import { ToastProvider } from './hooks/useToast';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { ErrorBoundary } from './components/ErrorBoundary';

import { useEffect } from 'react';

// Lazy-loaded pages — code-split into separate chunks
const RecordingPage = React.lazy(() => import('./pages/RecordingPage').then(m => ({ default: m.RecordingPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const History = React.lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const MeetingDetails = React.lazy(() => import('./pages/MeetingDetails').then(m => ({ default: m.MeetingDetails })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const TranscribePage = React.lazy(() => import('./pages/TranscribePage').then(m => ({ default: m.TranscribePage })));
const TasksPage = React.lazy(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const PasteAnalysisPage = React.lazy(() => import('./pages/PasteAnalysisPage').then(m => ({ default: m.PasteAnalysisPage })));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));

// Suspense fallback spinner
const PageLoader = () => (
  <div className="h-full flex items-center justify-center">
    <div className="w-8 h-8 border-[3px] border-[var(--soft)] border-t-[var(--accent)] rounded-full animate-spin" />
  </div>
);

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('nova-theme') || 'blue';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark' || savedTheme === 'natural' || savedTheme === 'warm') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <ToastProvider>
      <LoadingProvider>
        <ErrorBoundary>
          <Router>
            <Routes>
              <Route path="/login" element={
                <>
                  <SignedOut>
                    <LoginPage />
                  </SignedOut>
                  <SignedIn>
                    <Navigate to="/dashboard" replace />
                  </SignedIn>
                </>
              } />
              <Route path="/*" element={
                <>
                  <SignedIn>
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/record" element={<RecordingPage />} />
                          <Route path="/transcribe" element={<TranscribePage />} />
                          <Route path="/paste-analysis" element={<PasteAnalysisPage />} />
                          <Route path="/tasks" element={<TasksPage />} />
                          <Route path="/calendar" element={<CalendarPage />} />
                          <Route path="/history" element={<History />} />
                          <Route path="/analytics" element={<AnalyticsPage />} />
                          <Route path="/meeting/:id" element={<MeetingDetails />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="/profile" element={<ProfilePage />} />
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </SignedIn>
                  <SignedOut>
                    <Navigate to="/login" replace />
                  </SignedOut>
                </>
              } />
            </Routes>
          </Router>
        </ErrorBoundary>
      </LoadingProvider>
    </ToastProvider>
  );
}

export default App;
