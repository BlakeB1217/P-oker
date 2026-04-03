import { useState } from 'react';
import AppLayout from './components/AppLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import TrainerPage from './pages/TrainerPage.jsx';
import { usePracticeStats } from './hooks/usePracticeStats.js';

export default function App() {
  const [view, setView] = useState('home');
  const { stats, accuracy, recordHand } = usePracticeStats();

  return (
    <AppLayout current={view} onNavigate={setView} stats={stats} accuracy={accuracy}>
      {view === 'home' && (
        <HomePage onPractice={() => setView('practice')} onLearn={() => setView('learn')} />
      )}
      {view === 'learn' && (
        <LearnPage onPractice={() => setView('practice')} />
      )}
      {view === 'practice' && <TrainerPage onHandGraded={recordHand} />}
    </AppLayout>
  );
}
