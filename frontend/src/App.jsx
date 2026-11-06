import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FileExplorer from './pages/FileExplorer';
import Insights from './pages/Insights';

function App() {
  return (
    <Router>
      <nav>
          <Link to="/">Dashboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/explorer/:id" element={<FileExplorer />} />
        <Route path="/insights/:id" element={<Insights />} />
      </Routes>
    </Router>
  );
}

export default App;