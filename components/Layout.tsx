
import React from 'react';
import { User, UserRole } from '../types';
import { useDB } from '../src/store/DBContext';
import { 
  LayoutDashboard, Building2, School, Users, BookOpen, 
  Calendar, FileSpreadsheet, LogOut, Bell, FolderOpen, 
  Settings, Award, Activity, DoorOpen, RefreshCw
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activeView, setActiveView }) => {
  const { refresh, loading } = useDB();
  const menuItems = {
    [UserRole.ADMIN]: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { id: 'universities', label: 'Universités', icon: Building2 },
      { id: 'specialties', label: 'Spécialités', icon: School },
    ],
    [UserRole.AGENT]: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { id: 'monitoring', label: 'Suivi & Alertes', icon: Activity },
      { id: 'modules', label: 'Modules', icon: BookOpen },
      { id: 'teachers', label: 'Enseignants', icon: Users },
      { id: 'students', label: 'Étudiants', icon: Users },
      { id: 'timetable', label: 'Emploi du temps', icon: Calendar },
      { id: 'validation', label: 'Validations (Notes/Insc.)', icon: Award },
    ],
    [UserRole.TEACHER]: [
      { id: 'dashboard', label: 'Mon Planning', icon: Calendar },
      { id: 'grades', label: 'Saisie Notes', icon: FileSpreadsheet },
      { id: 'resources', label: 'Ressources', icon: FolderOpen },
    ],
    [UserRole.STUDENT]: [
      { id: 'dashboard', label: 'Mon Espace', icon: LayoutDashboard },
      { id: 'timetable', label: 'Emploi du temps', icon: Calendar },
      { id: 'resources', label: 'Cours & TD', icon: FolderOpen },
      { id: 'results', label: 'Mes Notes', icon: FileSpreadsheet },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ]
  };

  const currentMenu = menuItems[user.role] || [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white fixed h-full no-print flex flex-col">
        <div className="p-6 shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <School className="w-8 h-8 text-indigo-300" />
            EduQuest
          </h1>
          <p className="text-indigo-400 text-xs mt-1 uppercase tracking-widest font-semibold">Gestion Pédagogique</p>
        </div>
        
        <nav className="mt-6 px-4 space-y-1 flex-1 overflow-y-auto pb-4">
          {currentMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === item.id 
                  ? 'bg-indigo-700 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800 shrink-0">
          <div className="flex items-center gap-3 px-2 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-lg font-bold">
              {user.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{user.fullName}</p>
              <p className="text-xs text-indigo-300 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-rose-300 hover:bg-rose-900/30 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center no-print">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">
              {currentMenu.find(m => m.id === activeView)?.label || 'Bienvenue'}
            </h2>
            <p className="text-slate-500 mt-1">Gérez vos activités académiques en toute simplicité.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700">Aujourd'hui</span>
              <span className="text-xs text-slate-400">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[calc(100vh-200px)]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
