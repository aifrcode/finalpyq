import { useState, useEffect } from 'react';
import { useAuth } from '../useAuth';
import { db, collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy, handleFirestoreError, OperationType } from '../firebase';
import { supabase } from '../supabase';
import { Paper, UserProfile, UserRole } from '../types';
import { PaperCard } from './PaperCard';
import { Shield, Users, FileText, CheckCircle, XCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'papers' | 'users' | 'maintenance'>('papers');

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    // Listen for pending papers
    const papersQuery = query(collection(db, 'papers'), orderBy('createdAt', 'desc'));
    const unsubscribePapers = onSnapshot(papersQuery, (snapshot) => {
      const papersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Paper[];
      setPapers(papersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'papers', 'AdminDashboard: Fetch Papers');
    });

    // Listen for users
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
      setUsers(usersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users', 'AdminDashboard: Fetch Users');
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
      handleFirestoreError(error, OperationType.UPDATE, `papers/${id}`, 'AdminDashboard: Change Paper Status');
    }
  };

  const handleDeletePaper = async (id: string) => {
    const paper = papers.find(p => p.id === id);
    if (!paper) return;

    // window.confirm can be unreliable in iframes, so we'll proceed directly 
    // or you could implement a custom React modal for confirmation.
    try {
      // 1. Delete from Supabase Storage
      if (paper.pdfUrl) {
        let fileName = '';
        
        if (paper.pdfUrl.startsWith('http')) {
          // Legacy full URL
          const urlParts = paper.pdfUrl.split('/');
          fileName = urlParts[urlParts.length - 1];
        } else {
          // New filename-only format
          fileName = paper.pdfUrl;
        }

        if (fileName) {
          try {
            await supabase.storage
              .from('papers')
              .remove([fileName]);
          } catch (storageErr) {
            console.error('Error deleting from Supabase Storage:', storageErr);
          }
        }
      }

      // 2. Delete from Firestore
      await deleteDoc(doc(db, 'papers', id));
      toast.success('Paper deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `papers/${id}`, 'AdminDashboard: Delete Paper');
    }
  };

  const handleDeleteAllPapers = async () => {
    if (!window.confirm('CRITICAL: Are you sure you want to delete ALL papers from the database and storage? This cannot be undone.')) return;

    setLoading(true);
    let deletedCount = 0;
    try {
      for (const paper of papers) {
        // 1. Delete from Supabase Storage
        if (paper.pdfUrl) {
          let fileName = paper.pdfUrl.startsWith('http') 
            ? paper.pdfUrl.split('/').pop() 
            : paper.pdfUrl;

          if (fileName) {
            await supabase.storage.from('papers').remove([fileName]);
          }
        }
        // 2. Delete from Firestore
        await deleteDoc(doc(db, 'papers', paper.id));
        deletedCount++;
      }
      toast.success(`Successfully deleted ${deletedCount} papers`);
    } catch (error) {
      toast.error('Failed to delete all papers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDownloads = async () => {
    if (!window.confirm('Are you sure you want to reset ALL download counts to zero?')) return;

    setLoading(true);
    let resetCount = 0;
    try {
      for (const paper of papers) {
        await updateDoc(doc(db, 'papers', paper.id), { downloadCount: 0 });
        resetCount++;
      }
      toast.success(`Successfully reset ${resetCount} papers`);
    } catch (error) {
      toast.error('Failed to reset some counts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`, 'AdminDashboard: Change User Role');
    }
  };

  const handleVerificationChange = async (uid: string, verified: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { verified });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`, 'AdminDashboard: Change User Verification');
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
          <button 
            onClick={() => setActiveTab('maintenance')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'maintenance' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            MAINTENANCE
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
          {activeTab === 'papers' && (
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
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/10 bg-white/5">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="p-6 text-xs font-mono text-emerald-500 uppercase tracking-widest">Name</th>
                      <th className="p-6 text-xs font-mono text-emerald-500 uppercase tracking-widest">Email</th>
                      <th className="p-6 text-xs font-mono text-emerald-500 uppercase tracking-widest">Role</th>
                      <th className="p-6 text-xs font-mono text-emerald-500 uppercase tracking-widest text-center">Verified</th>
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
                        <td className="p-6 text-center">
                          <button
                            onClick={() => handleVerificationChange(user.uid, !user.verified)}
                            className={`p-2 rounded-xl transition-all ${user.verified ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                          >
                            {user.verified ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          </button>
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

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {users.map(user => (
                  <div key={user.uid} className="p-6 rounded-3xl border border-white/10 bg-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{user.name}</h3>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-mono uppercase ${user.role === 'admin' ? 'bg-red-500/10 text-red-500' : user.role === 'staff' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {user.role}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Verified</span>
                        <button
                          onClick={() => handleVerificationChange(user.uid, !user.verified)}
                          className={`p-2 rounded-xl transition-all ${user.verified ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                        >
                          {user.verified ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Role</span>
                        <select 
                          className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                        >
                          <option value="student">Student</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="max-w-4xl space-y-8">
              <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6">
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">System Maintenance</h3>
                <p className="text-gray-500 text-sm">Perform bulk actions to manage the portal's data.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-4">
                    <div className="flex items-center gap-3 text-red-500">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-bold uppercase tracking-tight">Clear Database</span>
                    </div>
                    <p className="text-xs text-gray-500">Permanently delete ALL papers from Firestore and Supabase Storage.</p>
                    <button 
                      onClick={handleDeleteAllPapers}
                      className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-colors"
                    >
                      DELETE ALL PAPERS
                    </button>
                  </div>

                  <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                    <div className="flex items-center gap-3 text-amber-500">
                      <Download className="w-5 h-5" />
                      <span className="text-sm font-bold uppercase tracking-tight">Reset Statistics</span>
                    </div>
                    <p className="text-xs text-gray-500">Reset the download count for all papers across the entire portal to zero.</p>
                    <button 
                      onClick={handleResetDownloads}
                      className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
                    >
                      RESET ALL DOWNLOAD COUNTS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
