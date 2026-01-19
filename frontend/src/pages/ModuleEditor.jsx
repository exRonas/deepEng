import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Layout, FileText, MessageSquare, CheckCircle, Table, GripVertical, Volume2 } from 'lucide-react';

const ModuleEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id && id !== 'new';
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/editor/modules/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/teacher-dashboard');
        } catch (error) {
            console.error('Failed to delete module:', error);
            alert('Failed to delete module');
        }
    };


    const [module, setModule] = useState({
        title: '',
        description: '',
        type: 'grammar', // grammar, vocabulary, reading, writing
        level: 'A1',
        content: {
            theory: [],
            ai_task: { prompt: '', system_message: '' },
            reflection: []
        },
        exercises: []
    });

    useEffect(() => {
        if (isEditing) {
            const fetchModule = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`/api/modules/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    let parsedContent = res.data.content;
                    if (typeof parsedContent === 'string') {
                        try { parsedContent = JSON.parse(parsedContent); } catch(e) {}
                    }
                    
                    setModule({
                        ...res.data,
                        content: parsedContent || { theory: [], ai_task: {}, reflection: [] },
                        exercises: res.data.exercises || []
                    });
                } catch (error) {
                    console.error("Failed to load module", error);
                }
            };
            fetchModule();
        }
    }, [id, isEditing]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const dataData = { ...module };
            
            if (isEditing) {
                await axios.put(`/api/editor/modules/${id}`, dataData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`/api/editor/modules`, dataData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            navigate('/teacher-dashboard');
        } catch (error) {
            console.error(error);
            alert('Error saving module');
        } finally {
            setLoading(false);
        }
    };

    // --- Helper Functions ---
    const updateMeta = (field, value) => setModule(prev => ({ ...prev, [field]: value }));
    const updateContent = (field, value) => setModule(prev => ({ ...prev, content: { ...prev.content, [field]: value } }));
    
    // Theory Handlers
    const addTheoryText = () => {
        const newTheory = [...(module.content.theory || []), "New paragraph"];
        updateContent('theory', newTheory);
    };

    const addTheoryTable = () => {
        const newTable = {
            type: 'table',
            headers: ['Header 1', 'Header 2'],
            rows: [['Cell 1', 'Cell 2'], ['Cell 3', 'Cell 4']]
        };
        const newTheory = [...(module.content.theory || []), newTable];
        updateContent('theory', newTheory);
    };

    const addTheoryWord = () => {
        // Based on user request format: "1. **word** - (trans) - def"
        // We create a structured object for this.
        const newWord = {
            type: 'vocabulary-word',
            word: 'word',
            translation: 'перевод',
            definition: 'definition',
            audio: ''
        };
        const newTheory = [...(module.content.theory || []), newWord];
        updateContent('theory', newTheory);
    };

    const updateTheoryItem = (idx, value) => {
        const newTheory = [...(module.content.theory || [])];
        newTheory[idx] = value;
        updateContent('theory', newTheory);
    };
    
    // Special handler for updating object deeply (table or word)
    const updateTheoryObject = (idx, field, value) => {
        const newTheory = [...(module.content.theory || [])];
        newTheory[idx] = { ...newTheory[idx], [field]: value };
        updateContent('theory', newTheory);
    };

    const removeTheoryItem = (idx) => {
        const newTheory = [...(module.content.theory || [])];
        newTheory.splice(idx, 1);
        updateContent('theory', newTheory);
    };
    
    const handleAudioUpload = async (file, idx) => {
        if (!module.title) {
            alert("Please enter a Module Title first (it's used for folder naming).");
            return;
        }

        const formData = new FormData();
        formData.append('moduleTitle', module.title);
        formData.append('audio', file);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/editor/upload-audio', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            
            // Should return { url: '/pronounce/slug/file.mp3' }
            updateTheoryObject(idx, 'audio', res.data.url);
        } catch (error) {
            console.error(error);
            alert('Upload failed');
        }
    };

    // Exercise Handlers
    const addExercise = () => {
        const newEx = {
            type: 'multiple-choice',
            question: '',
            options: ['Option 1', 'Option 2'],
            correct_answer: 'Option 1',
            explanation: ''
        };
        setModule(prev => ({ ...prev, exercises: [...prev.exercises, newEx] }));
    };
    const updateExercise = (idx, field, value) => {
        const newExercises = [...module.exercises];
        newExercises[idx] = { ...newExercises[idx], [field]: value };
        setModule(prev => ({ ...prev, exercises: newExercises }));
    };
    const removeExercise = (idx) => {
        const newExercises = [...module.exercises];
        newExercises.splice(idx, 1);
        setModule(prev => ({ ...prev, exercises: newExercises }));
    };
    const updateOption = (exIdx, optIdx, value) => {
        const newExercises = [...module.exercises];
        const newOptions = [...newExercises[exIdx].options];
        newOptions[optIdx] = value;
        newExercises[exIdx].options = newOptions;
        setModule(prev => ({ ...prev, exercises: newExercises }));
    };

    return (
        <div className="container">
            <div className="flex-between mb-4">
                <button onClick={() => navigate('/teacher-dashboard')} className="btn btn-outline btn-sm">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex gap-2">
                    {isEditing && (
                        <button 
                            onClick={handleDelete}
                            className="btn btn-danger"
                            style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #F87171' }}
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        <Save size={16} />
                        {loading ? 'Saving...' : 'Save Module'}
                    </button>
                </div>
            </div>
            
            <h1 className="mb-4">{isEditing ? 'Edit Module' : 'Create New Module'}</h1>

            {/* Metadata Card */}
            <div className="card">
                <div className="flex-center mb-4" style={{borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}>
                    <Layout size={20} className="text-muted" />
                    <h3>General Information</h3>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select 
                            className="input-field"
                            value={module.type}
                            onChange={(e) => updateMeta('type', e.target.value)}
                        >
                            <option value="grammar">Grammar</option>
                            <option value="vocabulary">Vocabulary</option>
                            <option value="reading">Reading</option>
                            <option value="writing">Writing</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Level</label>
                        <select 
                            className="input-field"
                            value={module.level}
                            onChange={(e) => updateMeta('level', e.target.value)}
                        >
                            <option value="A1">A1</option>
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Title</label>
                    <input 
                        className="input-field"
                        value={module.title}
                        onChange={(e) => updateMeta('title', e.target.value)}
                        placeholder="e.g. Present Simple"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                        className="input-field"
                        rows={2}
                        value={module.description}
                        onChange={(e) => updateMeta('description', e.target.value)}
                        placeholder="Short summary aimed at student..."
                    />
                </div>
            </div>

            {/* Content / Theory */}
            <div className="card">
                <div className="flex-between mb-4">
                    <div className="flex-center">
                        <FileText size={20} className="text-muted" />
                        <h3>Theory Content</h3>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={addTheoryText} className="btn btn-ghost btn-sm bg-gray-50 border">
                            <Plus size={14} style={{marginRight: '2px'}}/> Text
                        </button>
                        <button onClick={addTheoryTable} className="btn btn-ghost btn-sm bg-gray-50 border">
                            <Table size={14} style={{marginRight: '2px'}}/> Table
                        </button>
                        <button onClick={addTheoryWord} className="btn btn-ghost btn-sm bg-gray-50 border">
                            <Volume2 size={14} style={{marginRight: '2px'}}/> Vocab Word
                        </button>
                    </div>
                </div>

                <div className="flex-col">
                    {module.content.theory && module.content.theory.map((item, idx) => {
                        const isTable = typeof item === 'object' && item.type === 'table';
                        const isWord = typeof item === 'object' && item.type === 'vocabulary-word';

                        if (isWord) {
                            return (
                                <div key={idx} className="relative border rounded p-4 bg-gray-50 border-l-4 border-l-blue-400">
                                     <div className="flex-between mb-3 border-b pb-2">
                                        <div className="flex-center text-sm font-bold text-gray-600">
                                            <Volume2 size={16} /> Order {idx + 1}: Word Card
                                        </div>
                                        <button onClick={() => removeTheoryItem(idx)} className="btn btn-danger btn-sm">
                                            <Trash2 size={14} /> Remove
                                        </button>
                                     </div>

                                     <div className="flex gap-4 items-start">
                                         <div className="flex-grow grid grid-cols-1 gap-2">
                                             <div className="grid grid-cols-2 gap-2">
                                                 <div>
                                                     <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Word</label>
                                                     <input 
                                                        className="input-field"
                                                        value={item.word}
                                                        onChange={(e) => updateTheoryObject(idx, 'word', e.target.value)}
                                                        placeholder="e.g. mother"
                                                     />
                                                 </div>
                                                 <div>
                                                     <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Translation</label>
                                                     <input 
                                                        className="input-field"
                                                        value={item.translation}
                                                        onChange={(e) => updateTheoryObject(idx, 'translation', e.target.value)}
                                                        placeholder="e.g. мама"
                                                     />
                                                 </div>
                                             </div>
                                             <div>
                                                 <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Definition / Context</label>
                                                 <input 
                                                    className="input-field"
                                                    value={item.definition}
                                                    onChange={(e) => updateTheoryObject(idx, 'definition', e.target.value)}
                                                    placeholder="e.g. the woman who is your parent"
                                                 />
                                             </div>
                                         </div>

                                         <div className="w-48 flex flex-col gap-2 p-2 bg-white rounded border">
                                             <label className="text-xs font-bold uppercase text-gray-500 block">Audio</label>
                                             {item.audio ? (
                                                 <div className="text-center">
                                                     <audio controls src={item.audio} className="w-full mb-2 h-8" />
                                                     <button 
                                                        onClick={() => updateTheoryObject(idx, 'audio', '')}
                                                        className="text-red-500 text-xs hover:underline"
                                                     >
                                                         Remove Audio
                                                     </button>
                                                 </div>
                                             ) : (
                                                 <label className="cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded hover:bg-gray-50">
                                                     <Volume2 className="text-gray-400 mb-1" />
                                                     <span className="text-xs text-blue-600">Upload MP3</span>
                                                     <input 
                                                        type="file" 
                                                        accept="audio/*" 
                                                        className="hidden" 
                                                        onChange={(e) => handleAudioUpload(e.target.files[0], idx)}
                                                     />
                                                 </label>
                                             )}
                                         </div>
                                     </div>
                                </div>
                            );
                        }

                        if (isTable) {
                            return (
                                <div key={idx} className="relative border rounded p-4 bg-gray-50">
                                     <div className="flex-between mb-3 border-b pb-2">
                                        <div className="flex-center text-sm font-bold text-gray-600">
                                            <Table size={16} /> Order {idx + 1}: Table
                                        </div>
                                        <button onClick={() => removeTheoryItem(idx)} className="btn btn-danger btn-sm">
                                            <Trash2 size={14} /> Remove
                                        </button>
                                     </div>

                                     {/* Headers Editor */}
                                    <div className="mb-3">
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Headers (comma separated)</label>
                                        <input 
                                            className="input-field"
                                            value={item.headers.join(', ')}
                                            onChange={(e) => updateTheoryObject(idx, 'headers', e.target.value.split(',').map(h => h.trim()))}
                                            placeholder="Col 1, Col 2, Col 3"
                                        />
                                    </div>

                                    {/* Rows Editor */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Rows</label>
                                        <div className="flex flex-col gap-2">
                                            {item.rows.map((row, rIdx) => (
                                                <div key={rIdx} className="flex gap-2 items-center">
                                                    {row.map((cell, cIdx) => (
                                                        <input 
                                                            key={cIdx}
                                                            className="input-field py-1 px-2 text-sm"
                                                            value={cell}
                                                            onChange={(e) => {
                                                                const newRows = [...item.rows];
                                                                newRows[rIdx][cIdx] = e.target.value;
                                                                updateTheoryObject(idx, 'rows', newRows);
                                                            }}
                                                            placeholder={`Cell ${cIdx + 1}`}
                                                        />
                                                    ))}
                                                    <button 
                                                        onClick={() => {
                                                            const newRows = [...item.rows];
                                                            newRows.splice(rIdx, 1);
                                                            updateTheoryObject(idx, 'rows', newRows);
                                                        }}
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => {
                                                    // Add new row with empty cells based on header count
                                                    const emptyRow = new Array(item.headers.length).fill('');
                                                    updateTheoryObject(idx, 'rows', [...item.rows, emptyRow]);
                                                }}
                                                className="btn btn-sm btn-outline border-dashed text-gray-500 w-full justify-center"
                                            >
                                                <Plus size={14} /> Add Row
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={idx} className="relative">
                                <div className="form-group mb-1">
                                    <label className="text-sm text-muted">Order {idx + 1}: Paragraph</label>
                                    <textarea 
                                        className="input-field"
                                        rows={3}
                                        value={item}
                                        onChange={(e) => updateTheoryItem(idx, e.target.value)}
                                    />
                                </div>
                                <div className="flex-end">
                                    <button onClick={() => removeTheoryItem(idx)} className="btn btn-danger btn-sm">
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {(!module.content.theory || module.content.theory.length === 0) && (
                        <p className="text-muted text-sm italic p-4 text-center border rounded bg-gray-50">
                            No theory content added yet. Click buttons above to start.
                        </p>
                    )}
                </div>
            </div>

            {/* AI Task Config */}
            <div className="card" style={{borderLeft: '4px solid #8B5CF6'}}>
                <div className="flex-center mb-4">
                    <MessageSquare size={20} color="#8B5CF6" />
                    <h3 style={{color: '#7C3AED', marginBottom: 0}}>AI Speaking Task</h3>
                </div>
                <p className="text-sm mb-4">Configure the interactive AI persona the student will talk to at the end of the lesson.</p>

                <div className="form-group">
                    <label className="form-label">Student Instructions (Prompt)</label>
                    <input 
                        className="input-field"
                        value={module.content.ai_task?.prompt || ''}
                        onChange={(e) => setModule(prev => ({
                            ...prev,
                            content: { ...prev.content, ai_task: { ...(prev.content.ai_task || {}), prompt: e.target.value } }
                        }))}
                        placeholder="e.g., 'Say 3 sentences about yourself...'"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">System Message (AI Behavior)</label>
                    <textarea 
                        className="input-field"
                        rows={3}
                        value={module.content.ai_task?.system_message || ''}
                        onChange={(e) => setModule(prev => ({
                            ...prev,
                            content: { ...prev.content, ai_task: { ...(prev.content.ai_task || {}), system_message: e.target.value } }
                        }))}
                        placeholder="e.g., 'You are a kind teacher. Correct their grammar if they make mistakes with TO BE.'"
                    />
                </div>
            </div>

            {/* Exercises */}
            <div>
                <div className="flex-between mb-4">
                    <h2>Exercises</h2>
                    <button onClick={addExercise} className="btn btn-primary btn-sm">
                        <Plus size={16} /> Add Exercise
                    </button>
                </div>

                <div className="flex-col">
                    {module.exercises.map((ex, idx) => (
                        <div key={idx} className="card relative">
                            <div className="flex-between mb-4">
                                <div className="badge badge-blue">Question {idx + 1}</div>
                                <button onClick={() => removeExercise(idx)} className="btn btn-danger btn-sm">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select 
                                        className="input-field"
                                        value={ex.type}
                                        onChange={(e) => updateExercise(idx, 'type', e.target.value)}
                                    >
                                        <option value="multiple-choice">Multiple Choice</option>
                                        <option value="fill-gap">Fill Gap</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Question Text</label>
                                    <input 
                                        className="input-field"
                                        value={ex.question}
                                        onChange={(e) => updateExercise(idx, 'question', e.target.value)}
                                        placeholder="e.g. She ___ my sister."
                                    />
                                </div>
                            </div>

                            <div className="form-group bg-gray-50 p-4 rounded border">
                                <label className="form-label">Options</label>
                                <div className="form-row mb-2">
                                    {ex.options && ex.options.map((opt, optIdx) => (
                                        <div key={optIdx} className="input-group-responsive items-center">
                                            <div className="badge" style={{background: '#eee', color: '#666', marginRight: '5px'}}>{String.fromCharCode(65 + optIdx)}</div>
                                            <input 
                                                className="input-field"
                                                value={opt}
                                                onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => {
                                        const newOpts = [...(ex.options || []), ""];
                                        updateExercise(idx, 'options', newOpts);
                                    }}
                                    className="btn btn-ghost btn-sm"
                                >
                                    + Add Answer Option
                                </button>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Correct Answer</label>
                                    <input 
                                        className="input-field"
                                        style={{borderColor: '#10B981'}}
                                        value={ex.correct_answer}
                                        onChange={(e) => updateExercise(idx, 'correct_answer', e.target.value)}
                                        placeholder="Must match one option exactly"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Explanation</label>
                                    <input 
                                        className="input-field"
                                        value={ex.explanation}
                                        onChange={(e) => updateExercise(idx, 'explanation', e.target.value)}
                                        placeholder="Why is this correct?"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {module.exercises.length === 0 && (
                        <div className="card text-center p-4">
                            <p className="text-muted">No exercises created yet.</p>
                            <button onClick={addExercise} className="btn btn-outline">Create First Exercise</button>
                        </div>
                    )}
                </div>
            </div>
            
            <div style={{height: '100px'}}></div> {/* Spacer */}
        </div>
    );
};

export default ModuleEditor;
