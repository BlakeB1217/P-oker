import { useState, useEffect } from 'react';
import { supabase } from './services/supabase.js';
import AppLayout from './components/AppLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import TrainerPage from './pages/TrainerPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { usePracticeStats } from './hooks/usePracticeStats.js';

export default function App() {
  const [view, setView] = useState('home');
  const [session, setSession] = useState(null);
  const { stats, accuracy, recordHand } = usePracticeStats();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!session) return <AuthPage />;

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