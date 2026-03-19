
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { loadDBFromSupabase, INITIAL_DB, DB, clearLocalData } from './src/store/db';
import { supabaseService } from './src/services/supabaseService';
import { useDB } from './src/store/DBContext';
import Layout from './components/Layout';
import { AdminDashboard, UniversityManager, SpecialtyManager } from './components/AdminViews';
import { AgentDashboard, ModuleManager, TeacherAssignment, TimetableManager, ValidationManager, MonitoringView, StudentManager, RoomManager } from './components/AgentViews';
import { TeacherPlanning, TeacherGrades, TeacherResources } from './components/TeacherViews';
import { StudentDashboard, StudentGrades, StudentTimetable, StudentResources } from './components/StudentViews';
import { LogIn, ShieldAlert, Bell } from 'lucide-react';

const App: React.FC = () => {
  const { db, setDb, loading, error: dbError, refresh, forceSkipLoading } = useDB();
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await loadDBFromSupabase().then(() => ({ error: null })).catch(err => ({ error: err }));
        if (error) setConnectionStatus('error');
        else setConnectionStatus('connected');
      } catch {
        setConnectionStatus('error');
      }
    };
    checkConnection();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Query Supabase directly for the user
      const users = await supabaseService.getUsers();
      const foundUser = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
      
      if (foundUser) {
        setUser(foundUser);
        setActiveView('dashboard');
        setError('');
      } else {
        setError('Identifiants incorrects');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Erreur lors de la connexion au serveur");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginForm({ username: '', password: '' });
    setActiveView('dashboard');
    setShowNotifications(false);
  };

  const renderContent = () => {
    if (!user) return null;
    switch (user.role) {
      case UserRole.ADMIN:
        if (activeView === 'dashboard') return <AdminDashboard />;
        if (activeView === 'universities') return <UniversityManager />;
        if (activeView === 'specialties') return <SpecialtyManager />;
        break;

      case UserRole.AGENT:
        const specialty = db.specialties.find(s => s.agentId === user.id);
        if (!specialty) return <div className="text-center py-20 text-slate-400">Aucune spécialité assignée.</div>;
        if (activeView === 'dashboard') return <AgentDashboard agentId={user.id} setActiveView={setActiveView} setViewParams={setViewParams} />;
        if (activeView === 'monitoring') return <MonitoringView specialtyId={specialty.id} />;
        if (activeView === 'modules') return <ModuleManager specialtyId={specialty.id} />;
        if (activeView === 'teachers') return <TeacherAssignment specialtyId={specialty.id} />;
        if (activeView === 'students') return <StudentManager specialtyId={specialty.id} />;
        if (activeView === 'timetable') return <TimetableManager specialtyId={specialty.id} />;
        if (activeView === 'rooms') return <RoomManager specialtyId={specialty.id} />;
        if (activeView === 'validation') return <ValidationManager specialtyId={specialty.id} viewParams={viewParams} setViewParams={setViewParams} />;
        break;

      case UserRole.TEACHER:
        if (activeView === 'dashboard') return <TeacherPlanning teacherId={user.id} />;
        if (activeView === 'grades') return <TeacherGrades teacherId={user.id} />;
        if (activeView === 'resources') return <TeacherResources teacherId={user.id} />;
        break;

      case UserRole.STUDENT:
        if (activeView === 'dashboard') return <StudentDashboard studentId={user.id} />;
        if (activeView === 'results') return <StudentGrades studentId={user.id} />;
        if (activeView === 'timetable') return <StudentTimetable studentId={user.id} />;
        if (activeView === 'resources') return <StudentResources studentId={user.id} />;
        return <div className="p-10 text-center text-slate-400 italic">Page bientôt disponible.</div>;

      default:
        break;
    }
    // Fallback for unmatched cases
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-xl font-bold">Aucune interface disponible pour ce rôle ou cette vue.</div>;
  };

  const myNotifications = db.notifications.filter(n => n.userId === user?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const unreadCount = myNotifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    if (!user) return;
    const updated = {
      ...db,
      notifications: db.notifications.map(n => n.userId === user.id ? { ...n, read: true } : n)
    };
    setDb(updated);
    setShowNotifications(false);
  };

  const handleNotificationClick = (n: any) => {
    if (!user) return;
    
    // Mark as read
    const updated = {
      ...db,
      notifications: db.notifications.map(notif => notif.id === n.id ? { ...notif, read: true } : notif)
    };
    setDb(updated);

    const msg = n.message.toLowerCase();
    if (user.role === UserRole.STUDENT) {
        if (msg.includes('emploi du temps') || msg.includes('cours ajouté')) {
            setActiveView('timetable');
        } else if (msg.includes('note') || msg.includes('moyenne') || msg.includes('contestation') || msg.includes('répondu')) {
            setActiveView('results');
        } else if (msg.includes('inscription')) {
            setActiveView('dashboard');
        }
    } else if (user.role === UserRole.AGENT) {
        if (msg.includes('inscription')) {
            setActiveView('validation');
            setViewParams({ tab: 'registration' });
        } else if (msg.includes('note') || msg.includes('contestation')) {
            setActiveView('validation');
            setViewParams({ tab: 'grades' });
        }
    } else if (user.role === UserRole.TEACHER) {
        if (msg.includes('contestation')) {
            setActiveView('grades');
        }
    }
    setShowNotifications(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-2 animate-pulse">EduQuest</h1>
          <p className="text-indigo-400 text-sm uppercase tracking-[0.3em] font-semibold">Chargement des données...</p>
          {dbError && (
            <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm max-w-xs mx-auto">
              {dbError}. <button onClick={() => refresh()} className="underline font-bold">Réessayer</button>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <button 
              onClick={forceSkipLoading}
              className="text-slate-500 text-xs hover:text-slate-300 transition-colors underline"
              title="Utiliser les données locales si la connexion échoue"
            >
              Continuer avec les données locales
            </button>
            <button 
              onClick={() => {
                if(window.confirm("Voulez-vous vraiment effacer le cache local et resynchroniser ?")) {
                  clearLocalData();
                }
              }}
              className="text-rose-500/50 text-[10px] hover:text-rose-400 transition-colors underline uppercase font-bold tracking-wider"
            >
              Forcer la réinitialisation du cache
            </button>
          </div>
        </div>
        {!dbError && (
          <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-progress"></div>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-2">EduQuest</h1>
            <p className="text-indigo-400 text-sm uppercase tracking-[0.3em] font-semibold">Système de Gestion Pédagogique</p>
          </div>
          <div className="bg-white rounded-3xl shadow-2xl p-8 overflow-hidden relative">
            <form onSubmit={handleLogin} className="relative z-10 space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Connexion</h2>
              </div>
              {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-shake"><ShieldAlert className="w-5 h-5" /> {error}</div>}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Utilisateur</label>
                <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" placeholder="Ex: mourad" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Mot de passe</label>
                <input type="password" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"><LogIn className="w-5 h-5" /> Se connecter</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Layout user={user} onLogout={handleLogout} activeView={activeView} setActiveView={setActiveView}>
        <div className="absolute top-8 right-32 no-print z-[60]">
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 transition-colors relative rounded-full hover:bg-slate-100 ${unreadCount > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border rounded-2xl shadow-2xl overflow-hidden z-[70]">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center"><h4 className="font-bold text-slate-800">Notifications</h4><button onClick={markAllAsRead} className="text-xs text-indigo-600 font-bold hover:underline">Marquer lu</button></div>
                <div className="max-h-96 overflow-y-auto">
                  {myNotifications.map(n => (
                    <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={`p-4 border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${n.read ? 'opacity-60' : 'bg-indigo-50/20'}`}
                    >
                      <p className="text-xs text-slate-700 font-medium">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.date).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {renderContent()}
      </Layout>
    </div>
  );
};

export default App;
