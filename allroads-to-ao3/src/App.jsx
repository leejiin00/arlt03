import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GalleryPage from './pages/GalleryPage'
import DetailPage from './pages/DetailPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import BookmarkPage from './pages/BookmarkPage'
import BookmarkDetailPage from './pages/BookmarkDetailPage'
import WritingPage from './pages/WritingPage'
import CharacterPage from './pages/CharacterPage'
import StatsPage from './pages/StatsPage'
import ProtectedRoute from './components/ProtectedRoute'
import Decorations from './components/Decorations'

export default function App() {
  return (
    <BrowserRouter>
      <Decorations />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/fic/:id" element={<DetailPage />} />
        <Route path="/bookmarks" element={<BookmarkPage />} />
        <Route path="/bookmarks/:id" element={<BookmarkDetailPage />} />
        <Route path="/writing" element={<WritingPage />} />
        <Route path="/characters" element={<CharacterPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
