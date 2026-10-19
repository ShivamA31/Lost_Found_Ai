import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import LostDashboard from './pages/LostDashboard';
import FoundDashboard from './pages/FoundDashboard';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import SearchResults from './pages/SearchResults';
import MyReports from './pages/MyReports';
import ItemDetail from './pages/ItemDetail';
import ClaimPage from './pages/ClaimPage';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import EditItem from './pages/EditItem';
import Messages from './pages/Messages';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lost" element={<LostDashboard />} />
        <Route path="/found" element={<FoundDashboard />} />
        <Route path="/report-lost" element={<ReportLost />} />
        <Route path="/report-found" element={<ReportFound />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/edit-item/:id" element={<EditItem />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route path="/claim/:matchId" element={<ClaimPage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
