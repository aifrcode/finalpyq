import { useState, useEffect } from 'react';
import { useAuth } from '../useAuth';
import { db, collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from '../firebase';
import { Paper, UserProfile, UserRole } from '../types';
import { PaperCard } from './PaperCard';
import { Shield, Users, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'papers' | 'users'>('papers');

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    // Listen for pending papers
    const papersQuery = query(collection(db, 'papers'), orderBy('createdAt', 'desc'));
    const unsubscribePapers = onSnapshot(papersQuery, (snapshot) => {
      const papersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Paper[];
      setPapers(papersData);
      setLoading(false);
    });

    // Listen for users
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
      setUsers(usersData);
    });

    return () => {
      unsubscribePapers();
      unsubscribeUsers();
    };
  }, [profile]);

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'papers', id), { status });
    } catch (error) {
      console.error('Status change error:', error);
    }
  };

  const handleDeletePaper = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this paper?')) return;
    try {
      await deleteDoc(doc(db, 'papers', id));
    } catch (error) {
      console.error('Delete paper error:', error);
    }
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
    } catch (error) {
      console.error('Role change error:', error);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">RESTRICTED AREA</h2>
        <p className="text-gray-500 max-w-md">
          This dashboard is only accessible to administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">ADMIN DASHBOARD</h1>
          <p className="text-gray-500">Manage papers, users, and system statistics.</p>
        </div>
        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10">
          <button 
            onClick={() => setActiveTab('papers')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'papers' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            PAPERS
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            USERS
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'papers' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 text-emerald-500 mb-2">
                    <FileText className="w-5 h-5" />
                    <span className="text-xs font-mono uppercase tracking-widest">Total Papers</span>
                  </div>
                  <span className="text-4xl font-bold text-white">{papers.length}</span>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 text-amber-500 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-xs font-mono uppercase tracking-widest">Pending</span>
                  </div>
                  <span className="text-4xl font-bold text-white">{papers.filter(p => p.status === 'pending').length}</span>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 text-emerald-500 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-xs font-mono uppercase tracking-widest">Approved</span>
                  </div>
                  <span className="text-4xl font-bold text-white">{papers.filter(p => p.status === 'approved').length}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers.map(paper => (
                  <PaperCard 
                    key={paper.id} 
                    paper={paper} 
                    isAdminView 
                    onStatusChange={handleStatusChange} 
                    onDelete={handleDeletePaper}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-6 text-xs font-mono text-emerald-500 uppercase tracking-widest">Name</th>
                    <th className="p-6 text-xs font-mono text-emerald-500 uppercase tracking-widest">Email</th>
                    <th className="p-6 text-xs font-mono text-emerald-500 uppercase tracking-widest">Role</th>
                    <th className="p-6 text-xs font-mono text-emerald-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <Users className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="p-6 text-sm text-gray-400">{user.email}</td>
                      <td className="p-6">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-mono uppercase ${user.role === 'admin' ? 'bg-red-500/10 text-red-500' : user.role === 'staff' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-6">
                        <select 
                          className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                        >
                          <option value="student">Student</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
