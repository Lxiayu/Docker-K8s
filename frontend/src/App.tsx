import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pipelines from './pages/Pipelines'
import PipelineDetail from './pages/PipelineDetail'
import Repositories from './pages/Repositories'
import Deployments from './pages/Deployments'
import DeploymentDetail from './pages/DeploymentDetail'
import Images from './pages/Images'
import Monitoring from './pages/Monitoring'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import { useAuthStore } from './store/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  const { token } = useAuthStore()

  if (!token) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="pipelines" element={<Pipelines />} />
              <Route path="pipelines/:id" element={<PipelineDetail />} />
              <Route path="repositories" element={<Repositories />} />
              <Route path="deployments" element={<Deployments />} />
              <Route path="deployments/:id" element={<DeploymentDetail />} />
              <Route path="images" element={<Images />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
