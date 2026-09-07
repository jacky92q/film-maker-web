import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Library from './screens/Library';
import Editor from './screens/Editor';
import Preview from './screens/Preview';
import Export from './screens/Export';

export default function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Library />} />
        <Route path="/film/:id" element={<Editor />} />
        <Route path="/film/:id/preview" element={<Preview />} />
        <Route path="/film/:id/export" element={<Export />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
