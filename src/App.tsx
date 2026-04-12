/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { RecordingPage } from './pages/RecordingPage';
import { ProfilePage } from './pages/ProfilePage';
import { History } from './pages/History';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MeetingDetails } from './pages/MeetingDetails';
import { SettingsPage } from './pages/SettingsPage';
import { TranscribePage } from './pages/TranscribePage';
import { TasksPage } from './pages/TasksPage';
import { PasteAnalysisPage } from './pages/PasteAnalysisPage';
import { CalendarPage } from './pages/CalendarPage';
import { LoginPage } from './pages/LoginPage';
import { LoadingProvider } from './hooks/useLoading';
import { ToastProvider } from './hooks/useToast';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { ErrorBoundary } from './components/ErrorBoundary';

import { useEffect } from 'react';

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
