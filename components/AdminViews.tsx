import React, { useState, useEffect } from 'react';
import { generatePassword, clearLocalData } from '../src/store/db';
import { useDB } from '../src/store/DBContext';
import { University, Faculty, Specialty, SystemType, UserRole, User } from '../types';
import { supabaseService } from '../src/services/supabaseService';
// Fixed: Added School to the imports from lucide-react
import { Plus, Building2, Trash2, UserPlus, Printer, Search, School, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export const AdminDashboard = () => {
    // Vérification des crédits par semestre
    const checkSemesterCredits = () => {
      const semesters = [1, 2];
      let errors: string[] = [];
      semesters.forEach(sem => {
        // Pour chaque spécialité et niveau
        db.specialties.forEach(spec => {
          const levels = db.modules.filter(m => m.specialtyId === spec.id).map(m => m.level);
          Array.from(new Set(levels)).forEach(level => {
            const modules = db.modules.filter(m => m.specialtyId === spec.id && m.semester === sem && m.level === level);
            const totalCredits = modules.reduce((sum, m) => sum + m.credits, 0);
            if (totalCredits !== 30) {
              errors.push(`Spécialité ${spec.name}, niveau ${level}, semestre ${sem}: crédits = ${totalCredits}`);
            }
          });
        });
      });
      return errors;
    };

  const { db, setDb } = useDB();
  const stats = [
    { label: 'Universités', value: db.universities.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Facultés', value: db.faculties.length, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Spécialités', value: db.specialties.length, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Utilisateurs', value: db.users.length, icon: UserPlus, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Tableau de Bord Administrateur</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const UniversityManager = () => {
  const { db, setDb } = useDB();
  const [newUni, setNewUni] = useState('');
  const [newFac, setNewFac] = useState({ name: '', uniId: '' });
  const [error, setError] = useState('');

  const addUni = async () => {
    setError('');
    if (!newUni) {
      setError("Veuillez saisir le nom de l'université.");
      return;
    }
    const uni = { id: Date.now().toString(), name: newUni };
    try {
      await supabaseService.saveUniversity(uni);
      setDb(prev => ({ ...prev, universities: [...prev.universities, uni] }));
      setNewUni('');
    } catch (err: any) {
      setError("Erreur lors de l'ajout de l'université");
    }
  };

  const addFac = async () => {
    setError('');
    if (!newFac.name || !newFac.uniId) {
      setError("Veuillez saisir le nom de la faculté et sélectionner une université.");
      return;
    }
    const fac = { id: Date.now().toString(), universityId: newFac.uniId, name: newFac.name };
    try {
      await supabaseService.saveFaculty(fac);
      setDb(prev => ({ ...prev, faculties: [...prev.faculties, fac] }));
      setNewFac({ name: '', uniId: '' });
    } catch (err: any) {
      setError("Erreur lors de l'ajout de la faculté");
    }
  };

  const removeUni = async (id: string) => {
    setError('');
    if (db.faculties.some(f => f.universityId === id)) {
      setError("Impossible de supprimer cette université car elle contient des facultés.");
      return;
    }
    try {
      await supabaseService.deleteUniversity(id);
      setDb(prev => ({ ...prev, universities: prev.universities.filter(u => u.id !== id) }));
    } catch (err: any) {
      setError("Erreur lors de la suppression");
    }
  };

  const removeFac = async (id: string) => {
    setError('');
    if (db.specialties.some(s => s.facultyId === id)) {
      setError("Impossible de supprimer cette faculté car elle contient des spécialités.");
      return;
    }
    try {
      await supabaseService.deleteFaculty(id);
    } catch (err: any) {
      setError("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 text-sm font-medium animate-shake">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Ajouter une Université
        </h3>
        <div className="flex gap-4">
          <input 
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
            placeholder="Nom de l'université..."
            value={newUni}
            onChange={e => setNewUni(e.target.value)}
          />
          <button onClick={addUni} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Ajouter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold text-slate-700 mb-4">Liste des Universités</h3>
          <div className="space-y-2">
            {db.universities.map(u => (
              <div key={u.id} className="p-4 bg-white border rounded-lg flex justify-between items-center group hover:border-indigo-300">
                <span className="font-medium text-slate-700">{u.name}</span>
                <button onClick={() => removeUni(u.id)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-700 mb-4">Gestion des Facultés</h3>
          <div className="bg-white p-4 border rounded-xl space-y-4 mb-4">
             <select 
               className="w-full px-4 py-2 border rounded-lg outline-none"
               value={newFac.uniId}
               onChange={e => setNewFac({...newFac, uniId: e.target.value})}
             >
               <option value="">Sélectionner Université</option>
               {db.universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>
             <input 
               className="w-full px-4 py-2 border rounded-lg outline-none" 
               placeholder="Nom de la faculté..."
               value={newFac.name}
               onChange={e => setNewFac({...newFac, name: e.target.value})}
             />
             <button onClick={addFac} className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-900 transition-colors">
               Ajouter Faculté
             </button>
          </div>
          <div className="space-y-2">
            {db.faculties.map(f => (
              <div key={f.id} className="p-3 bg-slate-50 border rounded-lg flex justify-between items-center group">
                <div>
                  <span className="font-medium text-slate-700">{f.name}</span>
                  <p className="text-xs text-slate-400">{db.universities.find(u => u.id === f.universityId)?.name}</p>
                </div>
                <button onClick={() => removeFac(f.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SpecialtyManager = () => {
  const { db, setDb } = useDB();
  const [showModal, setShowModal] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newSpec, setNewSpec] = useState({
    name: '',
    facultyId: '',
    system: SystemType.LMD,
    agentName: '',
    agentUsername: ''
  });

  const addSpec = async () => {
    setError('');
    if (!newSpec.name || !newSpec.facultyId || !newSpec.agentName || !newSpec.agentUsername) {
      setError("Veuillez remplir tous les champs obligatoires pour la spécialité et l'agent.");
      return;
    }
    
    // Check if agent exists
    const existingAgent = db.users.find(u => u.username === newSpec.agentUsername);
    if (existingAgent) {
      setError("L'agent existe déjà avec ce nom d'utilisateur !");
      return;
    }

    const agentId = Date.now().toString() + '_agent';
    const password = generatePassword();
    const newAgent: User = {
      id: agentId,
      username: newSpec.agentUsername,
      password,
      role: UserRole.AGENT,
      fullName: newSpec.agentName
    };

    const specId = Date.now().toString() + '_spec';
    const newSpecialty: Specialty = {
      id: specId,
      facultyId: newSpec.facultyId,
      name: newSpec.name,
      system: newSpec.system,
      agentId: agentId
    };

    try {
      await supabaseService.saveUser(newAgent);
      await supabaseService.saveSpecialty(newSpecialty);
      setDb(prev => ({ 
        ...prev, 
        users: [...prev.users, newAgent],
        specialties: [...prev.specialties, newSpecialty]
      }));
      setSuccess("Spécialité créée avec succès !");
      setPrintData({ username: newAgent.username, password, fullName: newAgent.fullName, specialty: newSpecialty.name });
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de la spécialité");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Catalogue des Spécialités</h3>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
          <Plus className="w-5 h-5" />
          Nouvelle Spécialité
        </button>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-500">
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.specialties.map(s => {
          const faculty = db.faculties.find(f => f.id === s.facultyId);
          const agent = db.users.find(u => u.id === s.agentId);
          return (
            <div key={s.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{s.system}</span>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const pass = generatePassword();
                    // In a real app we'd update DB, but for demo we just show print
                    setPrintData({ username: agent?.username, password: 'Reprinted...', fullName: agent?.fullName, specialty: s.name });
                  }} className="text-slate-400 hover:text-indigo-600">
                    <Printer className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">{s.name}</h4>
              <p className="text-sm text-slate-500 mb-4">{faculty?.name}</p>
              <div className="pt-4 border-t flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                  {agent?.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Responsable Agent</p>
                  <p className="text-sm font-semibold text-slate-700">{agent?.fullName}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Ajouter Spécialité & Agent</h3>
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 text-sm font-medium animate-shake">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom Spécialité</label>
                <input 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={newSpec.name}
                  onChange={e => setNewSpec({...newSpec, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Faculté</label>
                  <select 
                    className="w-full px-4 py-2 border rounded-lg outline-none"
                    value={newSpec.facultyId}
                    onChange={e => setNewSpec({...newSpec, facultyId: e.target.value})}
                  >
                    <option value="">Sélectionner</option>
                    {db.faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Système</label>
                  <select 
                    className="w-full px-4 py-2 border rounded-lg outline-none"
                    value={newSpec.system}
                    onChange={e => setNewSpec({...newSpec, system: e.target.value as SystemType})}
                  >
                    {Object.values(SystemType).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="font-bold text-indigo-700 mb-3">Informations de l'Agent</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nom Complet de l'Agent</label>
                    <input 
                      className="w-full px-4 py-2 border rounded-lg outline-none" 
                      value={newSpec.agentName}
                      onChange={e => setNewSpec({...newSpec, agentName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nom d'Utilisateur</label>
                    <input 
                      className="w-full px-4 py-2 border rounded-lg outline-none" 
                      placeholder="Ex: agent_info"
                      value={newSpec.agentUsername}
                      onChange={e => setNewSpec({...newSpec, agentUsername: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-medium hover:bg-slate-50">Annuler</button>
                <button onClick={addSpec} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Créer Specialty</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {printData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-12 rounded-lg max-w-md w-full shadow-2xl relative text-center">
            <div className="mb-6 flex justify-center">
              <School className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Fiche d'Accès - Agent</h3>
            <p className="text-slate-500 mb-6">EduQuest - Système de Gestion</p>
            <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-indigo-200 text-left space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Agent</p>
                <p className="font-bold text-lg">{printData.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Spécialité</p>
                <p className="font-semibold">{printData.specialty}</p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm font-medium">Username: <span className="font-mono bg-indigo-100 px-2 py-0.5 rounded">{printData.username}</span></p>
                <p className="text-sm font-medium mt-1">Password: <span className="font-mono bg-indigo-100 px-2 py-0.5 rounded">{printData.password}</span></p>
              </div>
            </div>
            <button 
              onClick={() => { window.print(); setPrintData(null); }} 
              className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 mx-auto no-print"
            >
              <Printer className="w-5 h-5" />
              Imprimer & Fermer
            </button>
            <button onClick={() => setPrintData(null)} className="mt-4 text-slate-400 hover:text-slate-600 font-medium no-print">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};
