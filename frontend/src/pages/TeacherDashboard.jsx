import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Copy, Plus, BookOpen, X, MessageSquare, CheckCircle, FileText } from 'lucide-react';
import FormattedText from '../components/FormattedText';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]); // All available modules in system
  const [assignedModules, setAssignedModules] = useState([]); // Modules currently open (assigned)
  const [stats, setStats] = useState({ totalStudents: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedModuleToOpen, setSelectedModuleToOpen] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  // Drill-down State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [selectedProgress, setSelectedProgress] = useState(null); // Review a specific module
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Editing State
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [editScoreValue, setEditScoreValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [dashRes, modRes, assignRes] = await Promise.all([
             axios.get('/api/profile/teacher/dashboard', { headers }),
             axios.get('/api/modules'),
             axios.get('/api/assignments', { headers })
        ]);

        setStudents(dashRes.data.students);
        setStats(dashRes.data.stats);
        setModules(modRes.data);
        setAssignedModules(assignRes.data);
        setInviteLink(`${window.location.origin}/register`);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshAssignments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/assignments', { headers: { Authorization: `Bearer ${token}` } });
        setAssignedModules(res.data);
      } catch (e) {
          console.error(e);
      }
  };


  const fetchStudentHistory = async (student) => {
      setSelectedStudent(student);
      setLoadingHistory(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/teacher/student/${student.id}/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setStudentHistory(res.data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingHistory(false);
      }
  };

  const fetchProgressDetails = async (progressId) => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/teacher/progress/${progressId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedProgress(res.data);
        setIsEditingScore(false); // Reset edit mode
        setEditScoreValue(res.data.score); // Init edit value
      } catch (e) {
          console.error(e);
      }
  };

  const handleUpdateScore = async () => {
    try {
        const token = localStorage.getItem('token');
        await axios.put(`/api/teacher/progress/${selectedProgress.id}`, 
            { score: editScoreValue },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Update local state
        setSelectedProgress({ ...selectedProgress, score: editScoreValue });
        setIsEditingScore(false);
        
        // Refresh history to update list view
        if (selectedStudent) fetchStudentHistory(selectedStudent);
        
    } catch (e) {
        alert('Failed to update score');
        console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleOpenModule = async () => {
      if(!selectedModuleToOpen) return;
      try {
          const token = localStorage.getItem('token');
          await axios.post('/api/assignments', { moduleId: selectedModuleToOpen }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          // alert('Module opened successfully for the class!');
          setSelectedModuleToOpen('');
          refreshAssignments();
      } catch(e) {
          alert('Failed to open module');
      }
  };

  const handleCloseModule = async (moduleId) => {
      if(!window.confirm("Are you sure you want to close this module? Students will lose access.")) return;
      try {
          const token = localStorage.getItem('token');
          await axios.delete('/api/assignments', {
              headers: { Authorization: `Bearer ${token}` },
              data: { moduleId }
          });
          refreshAssignments();
      } catch(e) {
          alert('Failed to close module');
      }
  };

  const copyInvite = () => {
      navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard!');
  };

  if (loading) return <div className="container">Loading Dashboard...</div>;

  return (
    <div className="container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '2rem'}}>
        <div>
            <h1>Teacher Dashboard</h1>
            <p style={{color: '#666'}}>Manage your classroom, assignments, and view student progress.</p>
        </div>
        <button className="btn-outline" onClick={handleLogout} style={{borderColor: '#EF4444', color: '#EF4444'}}>Logout</button>
      </div>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card" style={{borderLeft: '4px solid #3B82F6'}}>
          <h3>Total Students</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalStudents}</p>
        </div>
        <div className="card" style={{borderLeft: '4px solid #10B981'}}>
          <h3>Class Average</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.avgScore}%</p>
        </div>
        <div className="card" style={{borderLeft: '4px solid #8B5CF6'}}>
          <h3>Available Modules</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{modules.length}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Student List */}
        <div>
            <h2 style={{marginBottom: '1rem'}}>Students (Click to view details)</h2>
            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Avg Score</th>
                    <th style={{ padding: '1rem' }}>Last Activity</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => (
                    <tr 
                        key={s.id} 
                        style={{ borderBottom: '1px solid #eee', cursor: 'pointer', background: selectedStudent?.id === s.id ? '#eff6ff' : 'transparent' }}
                        onClick={() => fetchStudentHistory(s)}
                    >
                        <td style={{ padding: '1rem' }}>
                            <div style={{fontWeight: 'bold', color: 'var(--primary)'}}>{s.full_name || s.username}</div>
                            <div style={{fontSize: '0.8rem', color: '#666'}}>{s.level}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '60px', height: '6px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(s.progress, 100)}%`, height: '100%', background: s.progress > 50 ? 'var(--primary)' : '#EF4444' }}></div>
                                </div>
                                {s.progress}%
                            </div>
                        </td>
                         <td style={{ padding: '1rem' }}>
                            {s.lastModuleTitle || '-'}
                         </td>
                        <td style={{ padding: '1rem' }}>
                        {s.progress > 50 ? '🟢 On Track' : '🟡 Needs Help'}
                        </td>
                    </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan="4" style={{padding: '2rem', textAlign: 'center', color: '#666'}}>No students yet. Invite them!</td></tr>}
                </tbody>
                </table>
            </div>
        </div>

        {/* Right Column: Actions & Details */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
            
             {/* Student History Detail Panel */}
             {selectedStudent && (
                 <div className="card" style={{border: '1px solid #e5e7eb', animation: 'fadeIn 0.3s'}}>
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                         <h3>📂 {selectedStudent.full_name || selectedStudent.username}</h3>
                         <button onClick={() => {setSelectedStudent(null); setSelectedProgress(null);}} style={{background: 'none', border: 'none', cursor: 'pointer'}}><X size={20}/></button>
                     </div>
                     
                     {loadingHistory ? <p>Loading history...</p> : (
                         <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                             {studentHistory.length === 0 ? <p style={{color: '#666'}}>No completed modules yet.</p> : (
                                 <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                     {studentHistory.map(h => (
                                         <div 
                                            key={h.id} 
                                            onClick={() => fetchProgressDetails(h.id)}
                                            style={{
                                                padding: '0.75rem', 
                                                border: '1px solid #eee', 
                                                borderRadius: '8px', 
                                                cursor: 'pointer',
                                                background: selectedProgress?.id === h.id ? '#f0f9ff' : 'white',
                                                transition: 'background 0.2s'
                                            }}
                                         >
                                             <div style={{fontWeight: 'bold', fontSize: '0.95rem'}}>{h.module_title}</div>
                                             <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', marginTop: '4px'}}>
                                                 <span>Score: <span style={{color: h.score > 60 ? 'green' : 'red', fontWeight: 'bold'}}>{h.score}%</span></span>
                                                 <span>{new Date(h.completed_at).toLocaleDateString()}</span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
             )}

            {/* Assignment Tool - Only show if no interaction or kept at bottom */}
            {!selectedProgress && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                    
                    {/* Open Module (Assign) */}
                    <div className="card">
                        <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
                            <BookOpen size={20} color="var(--primary)"/> Open Module (Unlock)
                        </h3>
                        <p style={{marginBottom: '1rem', color: '#666', fontSize: '0.9rem'}}>Select a module to unlock for all students in your class.</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select 
                            className="input-field" 
                            value={selectedModuleToOpen} 
                            onChange={(e) => setSelectedModuleToOpen(e.target.value)}
                            style={{ flex: 1 }}
                            >
                            <option value="">Select Module to Open...</option>
                            {modules
                                .filter(m => !assignedModules.some(am => am.module_id === m.id))
                                .map(m => (
                                <option key={m.id} value={m.id}>{m.title} ({m.type} - {m.level})</option>
                            ))}
                            </select>
                            <button className="btn btn-primary" onClick={handleOpenModule} disabled={!selectedModuleToOpen}>
                                <Plus size={20} /> Open
                            </button>
                        </div>
                    </div>

                    {/* Assigned Modules (Close/Lock) */}
                     <div className="card">
                        <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
                            <CheckCircle size={20} color="var(--secondary)"/> Open Modules
                        </h3>
                         {assignedModules.length === 0 ? <p style={{color: '#666'}}>No modules are currently open.</p> : (
                             <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                 {assignedModules.map(am => (
                                     <div key={am.id} style={{
                                         padding: '0.75rem', 
                                         border: '1px solid #eee', 
                                         borderRadius: '8px',
                                         display: 'flex',
                                         justifyContent: 'space-between',
                                         alignItems: 'center',
                                         background: '#F0FDF4'
                                     }}>
                                         <div>
                                            <div style={{fontWeight: 'bold'}}>{am.title}</div>
                                            <div style={{fontSize: '0.8rem', color: '#666'}}>{am.type} • {am.level} • Opened on {new Date(am.assigned_at).toLocaleDateString()}</div>
                                         </div>
                                         <button 
                                            onClick={() => handleCloseModule(am.module_id)}
                                            style={{
                                                background: '#FEF2F2', 
                                                color: '#EF4444', 
                                                border: '1px solid #FECACA',
                                                borderRadius: '6px',
                                                padding: '0.25rem 0.5rem',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                         >
                                             Close (Lock)
                                         </button>
                                     </div>
                                 ))}
                             </div>
                         )}
                    </div>

                </div>
            )}
            
            <div className="card">
                <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
                    <Copy size={20} color="var(--secondary)"/> Invite Students
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="input-field" value={inviteLink} readOnly />
                    <button className="btn btn-outline" onClick={copyInvite}>Copy</button>
                </div>
            </div>
        </div>
      </div>

       {/* Detailed Report Modal */}
       {selectedProgress && (
           <div style={{
               position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
               background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
           }}>
               <div style={{
                   background: 'white', width: '90%', maxWidth: '800px', maxHeight: '90vh', 
                   overflowY: 'auto', borderRadius: '12px', padding: '2rem', position: 'relative'
               }}>
                   <button 
                     onClick={() => setSelectedProgress(null)}
                     style={{position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer'}}
                   >
                       <X size={24}/>
                   </button>
                   
                   <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem'}}>
                       📝 {selectedStudent?.full_name}'s Report: {selectedProgress.module_title}
                   </h2>

                   <div style={{display: 'flex', gap: '2rem', marginBottom: '2rem'}}>
                       <div style={{minWidth: '150px'}}>
                           <div style={{color: '#666', fontSize: '0.9rem'}}>Score</div>
                           
                           {isEditingScore ? (
                               <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem'}}>
                                   <input 
                                       type="number" 
                                       className="input-field" 
                                       value={editScoreValue} 
                                       onChange={e => setEditScoreValue(Number(e.target.value))}
                                       style={{width: '80px', padding: '0.25rem'}}
                                   />
                                   <button 
                                       className="btn btn-primary" 
                                       onClick={handleUpdateScore}
                                       style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}
                                   >
                                       Save
                                   </button>
                                   <button 
                                       className="btn btn-outline" 
                                       onClick={() => setIsEditingScore(false)}
                                       style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}
                                   >
                                       Cancel
                                   </button>
                               </div>
                           ) : (
                               <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                   <div style={{fontSize: '2rem', fontWeight: 'bold', color: selectedProgress.score > 60 ? 'var(--secondary)' : 'red'}}>
                                       {selectedProgress.score}%
                                   </div>
                                   <button 
                                       className="btn btn-outline" 
                                       onClick={() => setIsEditingScore(true)}
                                       style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}
                                   >
                                       Edit
                                   </button>
                               </div>
                           )}
                       </div>
                       <div>
                           <div style={{color: '#666', fontSize: '0.9rem'}}>Date</div>
                           <div style={{fontSize: '1.2rem', marginTop: '0.5rem'}}>
                               {new Date(selectedProgress.completed_at).toLocaleString()}
                           </div>
                       </div>
                   </div>

                   {/* AI History Section */}
                   {selectedProgress.ai_history && (
                       <div style={{marginBottom: '2rem'}}>
                           <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7c3aed', marginBottom: '1rem'}}>
                               <MessageSquare size={20}/> AI Chat Log
                           </h3>
                           <div style={{
                               background: '#F9FAFB', border: '1px solid #e5e7eb', borderRadius: '8px', 
                               padding: '1rem', maxHeight: '300px', overflowY: 'auto'
                           }}>
                               {(JSON.parse(selectedProgress.ai_history)).map((msg, idx) => (
                                   <div key={idx} style={{marginBottom: '0.75rem'}}>
                                       <strong style={{color: msg.role === 'user' ? '#7c3aed' : '#059669'}}>
                                           {msg.role === 'user' ? 'Student' : 'AI Tutor'}:
                                       </strong>
                                       <div style={{marginLeft: '1rem', color: '#374151'}}>
                                          <FormattedText text={msg.content} />
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   {/* Reflection Section */}
                   {selectedProgress.reflection && (
                       <div style={{marginBottom: '2rem'}}>
                           <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '1rem'}}>
                               <FileText size={20}/> Reflection
                           </h3>
                           <div style={{background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '1rem'}}>
                               {Object.entries(JSON.parse(selectedProgress.reflection)).map(([q, ans], i) => (
                                   <div key={i} style={{marginBottom: '0.5rem'}}>
                                       <div style={{fontWeight: '500'}}>{selectedProgress.module_content ? JSON.parse(selectedProgress.module_content).reflection?.[q] : `Question ${parseInt(q)+1}`}</div>
                                       <div style={{fontStyle: 'italic', color: '#4b5563'}}>"{ans}"</div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}
            
                   {/* Exercises Details (If we had question text, we could look it up. For now showing answer keys) */}
                   {selectedProgress.details && (
                       <div>
                           <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', marginBottom: '1rem'}}>
                               <CheckCircle size={20}/> Exercise Answers
                           </h3>
                           <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem'}}>
                               {Object.entries(JSON.parse(selectedProgress.details)).map(([qId, ans], i) => (
                                   <div key={i} style={{padding: '0.75rem', border: '1px solid #eee', borderRadius: '6px', display: 'flex', justifyContent: 'space-between'}}>
                                       <span>Exercise #{qId}</span>
                                       <span style={{fontWeight: 'bold'}}>{ans}</span>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

               </div>
           </div>
       )}

    </div>
  );
};

export default TeacherDashboard;
