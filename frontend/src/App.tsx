import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/ProtectedRoute';
import { Spinner } from './components/ui/Spinner';

const WorkflowBuilderPage = lazy(() => import('./pages/workflows/WorkflowBuilderPage'));
import { SlidingAuth } from './components/auth/SlidingAuth';
import { SimpleAuthShell } from './components/auth/SimpleAuthShell';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkflowsListPage } from './pages/workflows/WorkflowsListPage';
import { WorkflowFormPage } from './pages/workflows/WorkflowFormPage';
import { WorkflowDetailPage } from './pages/workflows/WorkflowDetailPage';
import { ExecutionsPage } from './pages/executions/ExecutionsPage';
import { ExecutionDetailPage } from './pages/executions/ExecutionDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<SlidingAuth initialMode="login" />} />
              <Route path="/register" element={<SlidingAuth initialMode="register" />} />
              <Route
                path="/forgot-password"
                element={
                  <SimpleAuthShell>
                    <ForgotPasswordPage />
                  </SimpleAuthShell>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <SimpleAuthShell>
                    <ResetPasswordPage />
                  </SimpleAuthShell>
                }
              />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="/workflows" element={<WorkflowsListPage />} />
                <Route path="/workflows/new" element={<WorkflowFormPage />} />
                <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/executions" element={<ExecutionsPage />} />
                <Route path="/executions/:id" element={<ExecutionDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<Navigate to="/settings" replace />} />
              </Route>
              <Route
                path="/workflows/:id/builder"
                element={
                  <Suspense fallback={<Spinner />}>
                    <WorkflowBuilderPage />
                  </Suspense>
                }
              />
            </Route>

            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
