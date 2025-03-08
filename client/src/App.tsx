import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import {
  HomePage,
  ChatPage,
  ModelsPage,
  ToolsPage,
  EvaluationsPage,
  SettingsPage,
  NotFoundPage,
  AgentsPage
} from './pages';
import AgentDetailsPage from './pages/AgentDetailsPage';
import AgentChatPage from './pages/AgentChatPage';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:agentId/:sessionId" element={<AgentChatPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/agents/:agentId" element={<AgentDetailsPage />} />
            <Route path="/evaluations" element={<EvaluationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
