import { Navigate, Route, Routes } from 'react-router-dom';
import Library from './screens/Library';
import Editor from './screens/Editor';
import Preview from './screens/Preview';
import Export from './screens/Export';

// Routes are deliberately not wrapped in <AnimatePresence mode="wait">.
// Waiting on the outgoing screen's exit is fragile when that screen holds
// live work — with a soundtrack loaded in the editor, the presence never
// resolved and the URL changed while the old screen stayed on the display.
// Each screen plays its own entrance instead (see <Page>), which is the part
// anyone actually notices.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Library />} />
      <Route path="/film/:id" element={<Editor />} />
      <Route path="/film/:id/preview" element={<Preview />} />
      <Route path="/film/:id/export" element={<Export />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
