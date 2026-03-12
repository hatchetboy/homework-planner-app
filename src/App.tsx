import { useAuth } from './context/AuthContext';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { SettingsModal } from './components/SettingsModal';
import { TimeConfig } from './components/TimeConfig';
import { SubjectPlanner } from './components/SubjectPlanner';
import { ScheduleList } from './components/ScheduleList';
import { ChatInterface } from './components/ChatInterface';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { user, login, logout, isLoading } = useAuth();

  return (
    <>
      <nav className="glass-panel" style={{ borderRadius: 0, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="flex-center gap-4">
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary)' }}>Homework Planner</h1>
        </div>
        <div>
          {user ? (
            <div className="flex-center gap-4">
              <ErrorBoundary fallback={<span style={{ opacity: 0.5 }}>Settings unavailable</span>}>
                <SettingsModal />
              </ErrorBoundary>
              <span style={{ fontWeight: 600 }}>Hi, {user.name}!</span>
              <img src={user.picture} alt="Profile" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <Button variant="outline" onClick={() => logout()}>Logout</Button>
            </div>
          ) : (
            <Button onClick={() => login()} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Sign in with Google'}
            </Button>
          )}
        </div>
      </nav>

      <div className="container mt-4">
        {!user ? (
          <Card className="text-center mt-8">
            <h2>Welcome to Homework Planner!</h2>
            <p className="mb-4">Please sign in with Google to start planning your homework and sync it to your calendar.</p>
            <Button onClick={() => login()} className="animate-pulse">Get Started</Button>
          </Card>
        ) : (
          <div className="flex-column mt-4 pb-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="mb-6">Good evening, {user.name.split(' ')[0]}!</h2>

            <div className="flex-between gap-6 layout-columns">
              <div style={{ flex: 1, minWidth: '280px' }}>
                <ErrorBoundary>
                  <ChatInterface />
                </ErrorBoundary>
                <ErrorBoundary>
                  <TimeConfig />
                </ErrorBoundary>
                <ErrorBoundary>
                  <SubjectPlanner />
                </ErrorBoundary>
              </div>

              <div style={{ flex: 1, minWidth: '280px' }}>
                <ErrorBoundary>
                  <ScheduleList />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
