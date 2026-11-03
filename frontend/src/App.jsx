import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FileExplorer from './pages/FileExplorer';

function App() {
  return (
    <Router>
      <nav>
          <Link to="/">Dashboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/file-explorer/:id" element={<FileExplorer />} />
      </Routes>
    </Router>
  );
}

export default App;