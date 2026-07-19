import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ChapterPage, DailyPracticePage, FavoritesPage, FreePracticePage, HomePage, LearningPathPage, PracticePage, QuestionLibraryPage, SettingsPage, StatisticsPage, WrongBookPage } from './pages'

export function App() {
  return <Routes><Route element={<AppLayout />}><Route index element={<HomePage />} /><Route path="learning-path" element={<LearningPathPage />} /><Route path="chapter" element={<ChapterPage />} /><Route path="practice" element={<QuestionLibraryPage />} /><Route path="practice/:questionId" element={<PracticePage />} /><Route path="free-practice" element={<FreePracticePage />} /><Route path="daily-practice" element={<DailyPracticePage />} /><Route path="wrong-book" element={<WrongBookPage />} /><Route path="favorites" element={<FavoritesPage />} /><Route path="statistics" element={<StatisticsPage />} /><Route path="settings" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>
}
