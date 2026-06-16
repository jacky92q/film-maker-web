import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './store/auth';
import Splash from './screens/Splash';
import Login from './screens/Login';
import Register from './screens/Register';
import Home from './screens/Home';
import Projects from './screens/Projects';
import Editor from './screens/Editor';
import Preview from './screens/Preview';
import ExportScreen from './screens/Export';
import Settings from './screens/Settings';

function RequireAuth({ children }: { children: JSX.Element }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1700);
    return () => clearTimeout(t);
  }, []);

  if (showSplash) return <Splash />;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.split('/')[1] || 'root'}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/editor/:id" element={<RequireAuth><Editor /></RequireAuth>} />
        <Route path="/preview/:id" element={<RequireAuth><Preview /></RequireAuth>} />
        <Route path="/export/:id" element={<RequireAuth><ExportScreen /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
