import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Navbar } from './components/layout/Navbar';
import type { TabType } from './components/layout/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { RoutineList } from './components/routines/RoutineList';
import { RoutineEditor } from './components/routines/RoutineEditor';
import { AIRoutineGeneratorModal } from './components/routines/AIRoutineGeneratorModal';
import { LiveWorkoutModal } from './components/workout/LiveWorkoutModal';
import { HistoryView } from './components/history/HistoryView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ExerciseLibrary } from './components/exercises/ExerciseLibrary';
import { AICoachDrawer } from './components/coach/AICoachDrawer';
import { SettingsView } from './components/settings/SettingsView';

import { StorageService } from './services/storage';
import type {
  Routine,
  RoutineDay,
  WorkoutSession,
  UserProfileSettings,
  PersonalRecord,
} from './types/workout';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [settings, setSettings] = useState<UserProfileSettings>(StorageService.getSettings());
  const [routines, setRoutines] = useState<Routine[]>(StorageService.getRoutines());
  const [sessions, setSessions] = useState<WorkoutSession[]>(StorageService.getSessions());
  const [prs, setPrs] = useState<Record<string, PersonalRecord>>(StorageService.getPRs());
  const [activeWorkoutDraft, setActiveWorkoutDraft] = useState<WorkoutSession | null>(
    StorageService.getActiveSession()
  );

  // Modals & Drawers
  const [isCoachOpen, setIsCoachOpen] = useState<boolean>(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null | 'new'>(null);
  const [activeLiveWorkout, setActiveLiveWorkout] = useState<WorkoutSession | null>(null);

  // Reactive subscription to storage changes
  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
      setSettings(StorageService.getSettings());
      setRoutines(StorageService.getRoutines());
      setSessions(StorageService.getSessions());
      setPrs(StorageService.getPRs());
      setActiveWorkoutDraft(StorageService.getActiveSession());
    });

    return () => unsubscribe();
  }, []);

  const activeRoutine = routines.find((r) => r.id === settings.activeRoutineId) || routines[0];

  // Start workout from a routine and day
  const handleStartWorkout = (routine: Routine, day: RoutineDay) => {
    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      routineId: routine.id,
      routineTitle: routine.title,
      dayId: day.id,
      dayName: day.name,
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      totalVolumeKg: 0,
      totalSets: 0,
      totalReps: 0,
      exercises: day.exercises.map((ex) => {
        // Find previous logs if any to prefill
        const lastSessionWithEx = sessions.find((s) =>
          s.exercises.some((e) => e.exerciseId === ex.exerciseId)
        );
        const lastExLog = lastSessionWithEx?.exercises.find((e) => e.exerciseId === ex.exerciseId);

        const setsCount = ex.targetSets || 3;
        const sets = Array.from({ length: setsCount }).map((_, sIdx) => {
          const prevSet = lastExLog?.sets[sIdx];
          return {
            id: `set-${Date.now()}-${sIdx}-${Math.random()}`,
            setNumber: sIdx + 1,
            type: 'normal' as const,
            weight: prevSet?.weight || ex.suggestedWeight || 20,
            reps: prevSet?.reps || ex.targetRepsMin || 8,
            completed: false,
          };
        });

        return {
          id: `log-ex-${Date.now()}-${ex.id}`,
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          sets,
        };
      }),
    };

    StorageService.saveActiveSession(newSession);
    setActiveLiveWorkout(newSession);
  };

  const handleResumeWorkout = () => {
    if (activeWorkoutDraft) {
      setActiveLiveWorkout(activeWorkoutDraft);
    }
  };

  const handleFinishLiveWorkout = (_session: WorkoutSession) => {
    setActiveLiveWorkout(null);
    setCurrentTab('history');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Header
        onOpenCoach={() => setIsCoachOpen(true)}
        onOpenSettings={() => setCurrentTab('settings')}
      />

      {/* Main View Container */}
      <main className="app-container" style={{ flex: 1 }}>
        {currentTab === 'dashboard' && (
          <Dashboard
            settings={settings}
            activeRoutine={activeRoutine}
            sessions={sessions}
            prs={prs}
            activeWorkoutDraft={activeWorkoutDraft}
            onResumeActiveWorkout={handleResumeWorkout}
            onStartWorkout={handleStartWorkout}
            onOpenRoutines={() => setCurrentTab('routines')}
            onOpenAIGenerator={() => setIsGeneratorOpen(true)}
            onOpenCoach={() => setIsCoachOpen(true)}
            onOpenSettings={() => setCurrentTab('settings')}
            onOpenHistory={() => setCurrentTab('history')}
            onOpenAnalytics={() => setCurrentTab('analytics')}
          />
        )}

        {currentTab === 'routines' && (
          editingRoutine !== null ? (
            <RoutineEditor
              initialRoutine={editingRoutine === 'new' ? undefined : editingRoutine}
              onSave={(saved) => {
                StorageService.saveRoutine(saved);
                setEditingRoutine(null);
              }}
              onCancel={() => setEditingRoutine(null)}
            />
          ) : (
            <RoutineList
              routines={routines}
              activeRoutineId={settings.activeRoutineId}
              onSelectActiveRoutine={(id) => StorageService.saveSettings({ activeRoutineId: id })}
              onStartWorkout={handleStartWorkout}
              onEditRoutine={(r) => setEditingRoutine(r)}
              onOpenAIGenerator={() => setIsGeneratorOpen(true)}
              onCreateManualRoutine={() => setEditingRoutine('new')}
            />
          )
        )}

        {currentTab === 'history' && <HistoryView sessions={sessions} />}

        {currentTab === 'analytics' && (
          <AnalyticsView
            sessions={sessions}
            prs={prs}
            onOpenAIGenerator={() => setIsGeneratorOpen(true)}
            onOpenCoach={() => setIsCoachOpen(true)}
          />
        )}

        {currentTab === 'exercises' && <ExerciseLibrary />}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newSet) => StorageService.saveSettings(newSet)}
          />
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Modals & Overlays */}
      {isGeneratorOpen && (
        <AIRoutineGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          onRoutineCreated={(_routine) => {
            setCurrentTab('routines');
          }}
          onOpenSettings={() => {
            setIsGeneratorOpen(false);
            setCurrentTab('settings');
          }}
        />
      )}

      {isCoachOpen && (
        <AICoachDrawer
          isOpen={isCoachOpen}
          onClose={() => setIsCoachOpen(false)}
          onOpenSettings={() => {
            setIsCoachOpen(false);
            setCurrentTab('settings');
          }}
        />
      )}

      {activeLiveWorkout && (
        <LiveWorkoutModal
          initialSession={activeLiveWorkout}
          onFinish={handleFinishLiveWorkout}
          onCancel={() => setActiveLiveWorkout(null)}
        />
      )}
    </div>
  );
};

export default App;
