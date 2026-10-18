import { useEffect, useMemo, useState } from "react";
import {
    BookOpen, BrainCircuit, Check, ChevronLeft, ChevronRight, CircleHelp,
    Clock3, FileText, GraduationCap, Layers, LayoutDashboard, Menu, Plus,
    Sparkles, Target, Trash2, Upload, WandSparkles, X, Sun, Moon
} from "lucide-react";

const STORAGE_KEY = "studypilot-notes-v1";
const THEME_KEY = "studypilot-theme";
const SAMPLE = `Photosynthesis

Photosynthesis is the process by which green plants use light energy to make glucose from carbon dioxide and water. It mainly takes place in chloroplasts, which contain chlorophyll.

The overall word equation is:
carbon dioxide + water + light energy -> glucose + oxygen

Photosynthesis has two broad stages. The light-dependent reactions capture light energy and produce energy-carrying molecules. The Calvin cycle uses that energy to help convert carbon dioxide into sugars.

Factors that affect the rate of photosynthesis include light intensity, carbon dioxide concentration, temperature, and water availability.`;

const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "notes", label: "My notes", icon: FileText },
    { id: "quiz", label: "Quiz practice", icon: CircleHelp },
    { id: "flashcards", label: "Flashcards", icon: Layers }
];

function readSavedNotes() {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function App() {
    const [notes, setNotes] = useState(readSavedNotes);
    const [active, setActive] = useState("overview");
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [title, setTitle] = useState("");
    const [noteText, setNoteText] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const [quizCount, setQuizCount] = useState("5");
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem(THEME_KEY) || "dark";
        } catch {
            return "dark";
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch {
            // The theme still works if browser storage is unavailable.
        }
    }, [theme]);

    const currentNote = notes.find((note) => note.id === selectedNoteId) || null;
    const wordCount = noteText.trim() ? noteText.trim().split(/\s+/).length : 0;
    const quizScore = useMemo(() => {
        if (!result?.questions) return 0;
        return result.questions.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0);
    }, [result, answers]);

    function notify(message) {
        setToast(message);
        window.setTimeout(() => setToast(""), 2600);
    }

    function openNewNote() {
        setSelectedNoteId(null);
        setTitle("");
        setNoteText("");
        setResult(null);
        setError("");
        setActive("notes");
    }

    function openNote(note) {
        setSelectedNoteId(note.id);
        setTitle(note.title);
        setNoteText(note.text);
        setResult(null);
        setError("");
        setActive("notes");
    }

    function saveNote() {
        if (!title.trim() || !noteText.trim()) {
            setError("Add a title and some notes before saving.");
            return;
        }
        const now = new Date().toISOString();
        if (selectedNoteId) {
            setNotes((old) => old.map((n) => n.id === selectedNoteId
                ? { ...n, title: title.trim(), text: noteText, updatedAt: now } : n));
            notify("Notes updated");
        } else {
            const note = {
                id: crypto.randomUUID(),
                title: title.trim(),
                text: noteText,
                createdAt: now,
                updatedAt: now
            };
            setNotes((old) => [note, ...old]);
            setSelectedNoteId(note.id);
            notify("Notes saved");
        }
        setError("");
    }

    function deleteNote(id) {
        setNotes((old) => old.filter((n) => n.id !== id));
        if (selectedNoteId === id) {
            setSelectedNoteId(null);
            setTitle("");
            setNoteText("");
        }
        notify("Note deleted");
    }

    async function generate(action) {
        if (!noteText.trim()) {
            setError("Paste or write some notes first.");
            setActive("notes");
            return;
        }
        setLoading(true);
        setError("");
        setResult(null);
        setAnswers({});
        setSubmitted(false);
        setFlipped(false);
        setFlashcardIndex(0);
        try {
            const response = await fetch("/api/study", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, text: noteText, count: quizCount })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Something went wrong.");
            setResult({ type: action, data: data.result });
            setActive(action === "quiz" ? "quiz" : action === "flashcards" ? "flashcards" : "notes");
            if (action === "summarize") notify("Summary generated");
        } catch(e) {
            setError(e.message || "Could not reach the server. Is it running?");
        } finally {
            setLoading(false);
        }
    }

    async function importTextFile(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".txt")) {
            setError("For this starter version, please upload a .txt file.");
            return;
        }
        const text = await file.text();
        setNoteText(text);
        if (!title.trim()) setTitle(file.name.replace(/\.txt$/i, ""));
        setSelectedNoteId(null);
        setError("");
        notify("Text file imported");
    }

    const nav = (id) => {
        setActive(id);
        setError("");
    };

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-mark"><GraduationCap size={22} /></div>
                    <div><strong>StudyPilot</strong><span>AI STUDY SPACE</span></div>
                </div>
                <div className="workspace-label">WORKSPACE</div>
                <nav>
                    {navItems.map(({ id, label, icon: Icon }) => (
                        <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => nav(id)}>
                            <Icon size={18} /><span>{label}</span>
                            {id === "notes" && notes.length > 0 && <small>{notes.length}</small>}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-bottom">
                    <div className="mini-orb"><Sparkles size={17} /></div>
                    <strong>Your study space</strong>
                    <p>Your notes stay in this browser. AI features need an API key in the local server.</p>
                    <div className="privacy-tag"><span /> Local notes enabled</div>
                </div>
                <div className="sidebar-footer">STUDY SMARTER, NOT LONGER</div>
            </aside>

            <main className="main-area">
                <header className="topbar">
                    <div className="crumb"><span>Workspace</span><ChevronRight size={14} /><strong>{navItems.find((n) => n.id === active)?.label || "Study"}</strong></div>
                    <div className="topbar-right">
                        <button className="theme-toggle" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={`Swtich to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} type="button">
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                        </button>

                        <span className="status-dot" />Personal workspace<div className="avatar">S</div>
                    </div>
                </header>

                <div className="content">
                    {active === "overview" && (
                        <Overview notes={notes} onNew={openNewNote} onOpen={openNote} onNavigate={nav} />
                    )}

                    {active === "notes" && (
                        <section className="page">
                            <div className="page-heading">
                                <div><div className="eyebrow">YOUR KNOWLEDGE BASE</div><h1>My notes<span className="title-dot">.</span></h1><p>Capture your material, then turn it into revision tools.</p></div>
                                <button className="button button-primary" onClick={openNewNote}><Plus size={17} /> New notes</button>
                            </div>
                            <div className="notes-layout">
                                <section className="panel editor-panel">
                                    <div className="panel-head"><div><FileText size={18} /><strong>{selectedNoteId ? "Edit study notes" : "Create study notes"}</strong></div><span className="soft-badge">EDITOR</span></div>
                                    <label className="field-label" htmlFor="note-title">Note title</label>
                                    <input id="note-title" className="text-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Photosynthesis — Biology" maxLength={100} />
                                    <label className="field-label" htmlFor="note-content">Study material</label>
                                    <textarea id="note-content" className="notes-textarea" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Paste your lecture notes here..." />
                                    <div className="editor-meta"><span>{wordCount} words</span><label className="upload-link"><Upload size={15} /> Import .txt<input type="file" accept=".txt,text/plain" onChange={(e) => importTextFile(e.target.files?.[0])} /></label></div>
                                    {error && <div className="error-message"><X size={15} />{error}</div>}
                                    <div className="editor-actions">
                                        <button className="button button-secondary" onClick={() => { setTitle("Photosynthesis"); setNoteText(SAMPLE); setError(""); }}>Load sample</button>
                                        <button className="button button-primary" onClick={saveNote}><Check size={16} /> Save  notes</button>
                                    </div>
                                    <div className="ai-tools">
                                        <div className="ai-tools-title"><WandSparkles size={17} /><strong>Turn notes into study tools</strong></div>
                                        <button className="tool-row" disabled={loading} onClick={() => generate("summarize")}><span className="tool-icon purple"><Sparkles size={17} /></span><span><strong>Generate summary</strong><small>Key ideas and quick revision points</small></span><ChevronRight size={17} /></button>
                                        <div className="tool-row quiz-tool"><span className="tool-icon blue"><CircleHelp size={17} /></span><span><strong>Generate quiz</strong><small>Practice questions from your notes</small></span><select value={quizCount} onChange={(e) => setQuizCount(e.target.value)} aria-label="Number of quiz questions">{[3,5,8,10].map((n) => <option key={n} value={n}>{n} questions</option>)}</select><button className="icon-button" disabled={loading} onClick={() => generate("quiz")} aria-label="Generate quiz"><ChevronRight size={18} /></button></div>
                                        <button className="tool-row" disabled={loading} onClick={() => generate("flashcards")}><span className="tool-icon green"><Layers size={17} /></span><span><strong>Create flashcards</strong><small>Question-and-answer revision cards</small></span><ChevronRight size={17} /></button>
                                        {loading && <div className="loading-line"><span className="spinner" /> Creating your study material…</div>}
                                    </div>
                                    {result?.type === "summarize" && <SummaryPanel text={result.data} />}
                                </section>
                                <aside className="panel saved-panel">
                                    <div className="panel-head"><div><BookOpen size={18} /><strong>Saved notes</strong></div><span className="count-badge">{notes.length}</span></div>
                                    {notes.length === 0 ? <div className="empty-state"><div className="empty-icon"><FileText size={22} /></div><strong>No notes yet</strong><p>Save your first set of study notes to see them here.</p></div> :
                                        <div className="saved-list">{notes.map((n) => <div className={`saved-note ${n.id === selectedNoteId ? "selected" : ""}`} key={n.id}><button className="saved-note-main" onClick={() => openNote(n)}><span className="saved-note-icon"><FileText size={16} /></span><span><strong>{n.title}</strong><small>{n.text.trim().split(/\s+/).length} words · {new Date(n.updatedAt).toLocaleString()}</small></span></button><button className="delete-button" onClick={() => deleteNote(n.id)} aria-label={`Delete ${n.title}`}><Trash2 size={15} /></button></div>)}</div>}
                                    <div className="local-note"><span className="status-dot" /> Stored locally in this browser</div>
                                </aside>
                            </div>
                        </section>
                    )}

                    {active === "quiz" && (
                        <section className="page">
                            <div className="page-heading"><div><div className="eyebrow">TEST YOUR UNDERSTANDING</div><h1>Quiz practice<span className="title-dot">.</span></h1><p>Generate a quiz from your notes and check your understanding.</p></div><button className="button button-secondary" onClick={() => nav("notes")}><ChevronLeft size={17} /> Back to notes</button></div>
                            {!result || result.type !== "quiz" ? <div className="panel empty-feature"><div className="empty-icon"><CircleHelp size={26} /></div><h2>Ready for a quick challenge?</h2><p>Open your notes, then choose Generate quiz. Questions will be based on the material you provide.</p><button className="button button-primary" onClick={() => nav("notes")}>Choose study notes <ChevronRight size={16} /></button></div> :
                                <div className="quiz-container">
                                    <div className="quiz-top"><div><span className="soft-badge">PRACTICE QUIZ</span><h2>Check what you know</h2><p>{result.data.questions.length} questions generated from your notes</p></div><div className="quiz-score"><span>{submitted ? quizScore : Object.keys(answers).length}</span><small>{submitted ? `of ${result.data.questions.length} correct` : `of ${result.data.questions.length} answered`}</small></div></div>
                                    {result.data.questions.map((q, i) => <div className="panel question-card" key={`${i}-${q.question}`}><div className="question-number">QUESTION {String(i + 1).padStart(2, "0")}</div><h3>{q.question}</h3><div className="options-list">{q.options.map((option, j) => { const chosen = answers[i] === j; const correct = submitted && q.answer === j; const wrong = submitted && q.answer !== j; return <button key={j} disabled={submitted} onClick={() => setAnswers((old) => ({ ...old, [i]: j}))} className={`answer-option ${chosen ? "chosen" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}><span className="option-letter">{String.fromCharCode(65 + j)}</span><span>{option}</span>{correct && <Check size={16} />}</button>; })}</div>{submitted && <div className="explanation"><strong>Explanation</strong><p>{q.explanation}</p></div>}</div>)}
                                    <div className="quiz-actions">{submitted ? <button className="button button-secondary" onClick={() => {setAnswers({});setSubmitted(false);}}>Try again</button> : <button className="button button-primary" disabled={Object.keys(answers).length !== result.data.questions.length} onClick={() => setSubmitted(true)}>Check answers <Check size={16} /></button>}<button className="button button-secondary" onClick={() => nav("notes")}>Make another quiz</button></div>
                                </div>}
                            {error && <div className="error-message">{error}</div>}
                        </section>
                    )}

                    {active === "flashcards" && (
                        <section clashName="page">
                            <div className="page-heading"><div><div className="eyebrow">ACTIVE RECALL</div><h1>Flashcards<span className="title-dot">.</span></h1><p>Flip a card, recall the answer, and strengthen memory.</p></div><button className="button button-secondary" onClick={() => nav("notes")}><ChevronLeft size={17} /> Back to notes</button></div>
                            {!result || result.type !== "flashcards" ? <div className="panel empty-feature"><div className="empty-icon"><Layers size={26}/></div><h2>Make revision cards</h2><p>Generate a set of flashcards from any notes you have written or saved.</p><button className="button button-primary" onClick={() => nav("notes")}>Choose study notes <ChevronRight size={16}/></button></div> :
                <div className="flashcard-area"><div className="flashcard-progress"><span>Card {flashcardIndex + 1} of {result.data.cards.length}</span><div className="progress-track"><div style={{width: `${((flashcardIndex + 1) / result.data.cards.length) * 100}%`}}/></div></div><button className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((v) => !v)}><span className="flashcard-label">{flipped ? "ANSWER" : "QUESTION"}</span><span className="flashcard-text">{flipped ? result.data.cards[flashcardIndex].back : result.data.cards[flashcardIndex].front}</span><span className="flip-hint"><Layers size={15}/> Tap to flip</span></button><div className="flashcard-controls"><button className="button button-secondary" disabled={flashcardIndex === 0} onClick={() => {setFlashcardIndex((i) => i - 1);setFlipped(false);}}><ChevronLeft size={17}/> Previous</button><button className="button button-primary" disabled={flashcardIndex === result.data.cards.length - 1} onClick={() => {setFlashcardIndex((i) => i + 1);setFlipped(false);}}>Next card <ChevronRight size={17}/></button></div><button className="text-button" onClick={() => generate("flashcards")}>Generate a new set</button></div>}
              {error && <div className="error-message">{error}</div>}
            </section>
          )}
        </div>
        <footer className="main-footer"><span>StudyPilot AI <span className="footer-dot">•</span> MVP v1.0</span><span><Clock3 size={13}/> Built for focused learning</span></footer>
      </main>
      {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    </div>
  );
}

function Overview({ notes, onNew, onOpen, onNavigate }) {
  const words = notes.reduce((sum, n) => sum + n.text.trim().split(/\s+/).filter(Boolean).length, 0);
  return <section className="page overview-page">
    <div className="welcome-row"><div><div className="eyebrow">YOUR PERSONAL LEARNING SPACE</div><h1>Good to see you<span className="title-dot">.</span></h1><p>Turn what you're learning into knowledge that sticks.</p></div><div className="welcome-spark"><Sparkles size={24}/></div></div>
    <div className="hero-card"><div className="hero-copy"><span className="hero-pill"><Sparkles size={13}/> YOUR AI STUDY PARTNER</span><h2>Study smarter.<br/><em>Remember more.</em></h2><p>Start with your notes. StudyPilot helps you turn them into summaries, quizzes, and flashcards so you can focus on understanding.</p><button className="button button-light" onClick={onNew}>Create your first notes <ChevronRight size={17}/></button></div><div className="hero-art"><div className="art-glow"/><div className="art-sheet sheet-back"><span/><span/><span/></div><div className="art-sheet sheet-front"><div className="art-icon"><BrainCircuit size={25}/></div><strong>Study session</strong><div className="art-line long"/><div className="art-line"/><div className="art-progress"><span/></div><div className="art-caption">Keep your momentum</div></div><div className="float-chip chip-one"><Check size={14}/> Notes saved</div><div className="float-chip chip-two"><Sparkles size={14}/> AI tools</div></div></div>
    <div className="section-title-row"><div><h2>Your study overview</h2><p>A small snapshot of your learning workspace.</p></div><button className="text-button" onClick={() => onNavigate("notes")}>View all notes <ChevronRight size={15}/></button></div>
    <div className="stats-grid"><Stat icon={FileText} label="Saved notes" value={notes.length} hint="Your personal library" color="purple"/><Stat icon={BookOpen} label="Words collected" value={words.toLocaleString()} hint="Across your notes" color="blue"/><Stat icon={Target} label="Study tools" value="3" hint="Summary, quiz, cards" color="green"/></div>
    <div className="lower-grid"><section className="panel recent-panel"><div className="panel-head"><div><Clock3 size={18}/><strong>Recently updated</strong></div><button className="text-button" onClick={() => onNavigate("notes")}>See all</button></div>{notes.length === 0 ? <div className="recent-empty"><div className="empty-icon"><FileText size={21}/></div><div><strong>Your recent notes will appear here</strong><p>Create a note or load the sample to explore StudyPilot.</p></div></div> : notes.slice(0, 4).map((n) => <button className="recent-row" key={n.id} onClick={() => onOpen(n)}><span className="recent-file"><FileText size={17}/></span><span className="recent-name"><strong>{n.title}</strong><small>{n.text.trim().split(/\s+/).length} words</small></span><span className="recent-date">{new Date(n.updatedAt).toLocaleDateString()}</span><ChevronRight size={16}/></button>)}</section>
      <section className="panel quick-panel"><div className="panel-head"><div><WandSparkles size={18}/><strong>Quick actions</strong></div></div><button className="quick-action" onClick={onNew}><span className="quick-icon purple"><Plus size={18}/></span><span><strong>Write new notes</strong><small>Start a fresh study page</small></span><ChevronRight size={16}/></button><button className="quick-action" onClick={() => onNavigate("quiz")}><span className="quick-icon blue"><CircleHelp size={18}/></span><span><strong>Quiz practice</strong><small>Test what you understand</small></span><ChevronRight size={16}/></button><button className="quick-action" onClick={() => onNavigate("flashcards")}><span className="quick-icon green"><Layers size={18}/></span><span><strong>Review flashcards</strong><small>Practice active recall</small></span><ChevronRight size={16}/></button></section></div>
    <div className="disclaimer"><div className="disclaimer-icon"><BrainCircuit size={18}/></div><div><strong>Study tip</strong><p>AI-generated material can contain mistakes. Check important facts against your textbook or class notes.</p></div></div>
  </section>;
}

function Stat({ icon: Icon, label, value, hint, color }) {
  return <div className="panel stat-card"><div className={`stat-icon ${color}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>;
}

function SummaryPanel({ text }) {
  return <div className="summary-result"><div className="summary-heading"><Sparkles size={17}/><strong>AI summary</strong></div><pre>{text}</pre></div>;
}

export default App;