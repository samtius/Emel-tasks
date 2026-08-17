"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type Template = { id: string; title: string; room: string; minutes: number; icon: string; steps: string[] };
type Subtask = { id: string; title: string; position: number; completed: boolean };
type Task = { id: string; template_id: string | null; title: string; category: string; estimated_minutes: number | null; completed: boolean; subtasks: Subtask[] };
type Routine = { id: string; title: string; icon: string; subtitle: string; steps: { id: string; title: string }[] };

const templates: Template[] = [
  { id: "kitchen", title: "Städa köket", room: "Kök", minutes: 25, icon: "🍋", steps: ["Plocka undan", "Fyll diskmaskinen", "Torka bänkarna", "Rengör spisen", "Torka diskhon", "Dammsug golvet"] },
  { id: "bathroom", title: "Städa badrummet", room: "Badrum", minutes: 20, icon: "🫧", steps: ["Plocka undan", "Rengör handfatet", "Putsa spegeln", "Rengör toaletten", "Torka duschen", "Våttorka golvet"] },
  { id: "bedroom", title: "Fixa sovrummet", room: "Sovrum", minutes: 15, icon: "🌙", steps: ["Bädda sängen", "Lägg kläder på plats", "Plocka undan ytor", "Dammtorka", "Dammsug golvet"] },
  { id: "living-room", title: "Städa vardagsrummet", room: "Vardagsrum", minutes: 20, icon: "🌿", steps: ["Plocka undan", "Vik filtar", "Torka av bord", "Dammtorka", "Puffa kuddarna", "Dammsug golvet"] },
];

const compliments = [
  "Bra jobbat! Du tog dig hela vägen.",
  "Snyggt gjort! Nu kan du vara riktigt nöjd.",
  "Vilken insats! Alla små steg blev något stort.",
  "Du fixade det! Dags att njuta av resultatet.",
  "Fantastiskt jobbat! Ett steg i taget fungerade.",
];

const routines: Routine[] = [
  { id: "morning", title: "Morgonrutin", icon: "☀️", subtitle: "En lugn start på dagen", steps: [
    { id: "morning-breakfast", title: "Ställ in frukost i kylen" },
    { id: "morning-teeth", title: "Borsta tänderna" },
    { id: "morning-bag", title: "Packa jobbväskan" },
  ] },
  { id: "evening", title: "Kvällsrutin", icon: "🌙", subtitle: "Gör morgondagen lite enklare", steps: [
    { id: "evening-clothes", title: "Lägg fram kläder till imorgon" },
    { id: "evening-teeth", title: "Borsta tänderna" },
    { id: "evening-alarm", title: "Ställ alarmet" },
  ] },
];

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [routineCompletionMessage, setRoutineCompletionMessage] = useState<string | null>(null);
  const [routineCompleted, setRoutineCompleted] = useState<Set<string>>(new Set());
  const [currentDay, setCurrentDay] = useState(todayKey);
  const [tab, setTab] = useState<"routines" | "today" | "library">("routines");
  const [busy, setBusy] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("tasks")
      .select("id, template_id, title, category, estimated_minutes, completed, subtasks(id, title, position, completed)")
      .eq("archived", false)
      .order("created_at", { ascending: false }).order("position", { referencedTable: "subtasks", ascending: true });
    if (error) setMessage(error.message);
    else {
      const activeTasks = (data ?? []) as Task[];
      setTasks(activeTasks);
      setSelectedTaskId((current) => activeTasks.some((item) => item.id === current) ? current : activeTasks[0]?.id ?? null);
    }
  }, []);

  const loadRoutineCompletions = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("routine_completions").select("item_id").eq("completed_on", currentDay);
    if (error) setMessage(error.message);
    else setRoutineCompleted(new Set((data ?? []).map((item) => item.item_id as string)));
  }, [currentDay]);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setAuthReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (user) { void loadTasks(); void loadRoutineCompletions(); }
    else { setTasks([]); setRoutineCompleted(new Set()); }
  }, [user, loadTasks, loadRoutineCompletions]);
  useEffect(() => {
    const refreshDay = () => setCurrentDay(todayKey());
    const interval = window.setInterval(refreshDay, 60_000);
    document.addEventListener("visibilitychange", refreshDay);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", refreshDay); };
  }, []);

  const task = tasks.find((item) => item.id === selectedTaskId) ?? null;
  const template = templates.find((item) => item.id === task?.template_id);
  const completedCount = task?.subtasks.filter((step) => step.completed).length ?? 0;
  const progress = task?.subtasks.length ? Math.round((completedCount / task.subtasks.length) * 100) : 0;
  const nextStep = useMemo(() => task?.subtasks.find((step) => !step.completed), [task]);
  const activeRoutines = routines.filter((routine) => !routine.steps.every((step) => routineCompleted.has(step.id)));

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault(); if (!supabase) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? error.message : "Vi har skickat en inloggningslänk till din e-post."); setBusy(false);
  }

  async function createFromTemplate(selected: Template) {
    if (!supabase || !user) return;
    setBusy(true); setMessage("");
    const { data: created, error } = await supabase.from("tasks").insert({ user_id: user.id, template_id: selected.id, title: selected.title, category: selected.room, estimated_minutes: selected.minutes }).select("id").single();
    if (error) { setMessage(error.message); setBusy(false); return; }
    const { error: stepError } = await supabase.from("subtasks").insert(selected.steps.map((title, position) => ({ task_id: created.id, user_id: user.id, title, position })));
    if (stepError) setMessage(stepError.message);
    await loadTasks(); setSelectedTaskId(created.id); setTab("today"); setBusy(false);
  }

  async function toggleRoutineStep(itemId: string) {
    if (!supabase || !user) return;
    const wasCompleted = routineCompleted.has(itemId);
    const selectedRoutine = routines.find((routine) => routine.steps.some((step) => step.id === itemId));
    const completesRoutine = !wasCompleted && selectedRoutine?.steps.every((step) => step.id === itemId || routineCompleted.has(step.id));
    setRoutineCompleted((current) => {
      const next = new Set(current);
      if (wasCompleted) next.delete(itemId); else next.add(itemId);
      return next;
    });
    const { error } = wasCompleted
      ? await supabase.from("routine_completions").delete().eq("user_id", user.id).eq("item_id", itemId).eq("completed_on", currentDay)
      : await supabase.from("routine_completions").upsert({ user_id: user.id, item_id: itemId, completed_on: currentDay });
    if (error) { setMessage(error.message); await loadRoutineCompletions(); }
    else if (completesRoutine) setRoutineCompletionMessage(compliments[Math.floor(Math.random() * compliments.length)]);
  }

  async function restoreRoutine(routine: Routine) {
    if (!supabase || !user) return;
    setBusy(true); setMessage("");
    const itemIds = routine.steps.map((step) => step.id);
    const { error } = await supabase.from("routine_completions").delete().eq("user_id", user.id).eq("completed_on", currentDay).in("item_id", itemIds);
    if (error) setMessage(error.message);
    else {
      setRoutineCompleted((current) => {
        const next = new Set(current);
        itemIds.forEach((itemId) => next.delete(itemId));
        return next;
      });
      setTab("routines");
    }
    setBusy(false);
  }

  async function toggleStep(step: Subtask) {
    if (!supabase || !task) return;
    const completesTask = !step.completed && task.subtasks.every((item) => item.id === step.id || item.completed);
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, subtasks: item.subtasks.map((subtask) => subtask.id === step.id ? { ...subtask, completed: !subtask.completed } : subtask) } : item));
    const { error } = await supabase.from("subtasks").update({ completed: !step.completed }).eq("id", step.id);
    if (error) { setMessage(error.message); await loadTasks(); }
    else if (completesTask) setCompletionMessage(compliments[Math.floor(Math.random() * compliments.length)]);
  }

  async function archiveTask() {
    if (!supabase || !task) return;
    setBusy(true);
    const { error } = await supabase.from("tasks").update({ archived: true, updated_at: new Date().toISOString() }).eq("id", task.id);
    if (error) setMessage(error.message);
    else {
      await loadTasks();
      setCompletionMessage(null);
    }
    setConfirmArchive(false); setBusy(false);
  }

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (!authReady) return <main className="center-screen"><p>Laddar…</p></main>;
  if (!user) return <LoginScreen email={email} setEmail={setEmail} message={message} busy={busy} onSubmit={sendMagicLink} />;

  return <main className="app-shell">
    <header className="topbar"><div><p className="eyebrow">Din lugna tasklista</p><h1>Hej Emelie <span aria-hidden="true">👋</span></h1><p className="intro">Ett litet steg i taget räcker.</p></div><button className="avatar" aria-label="Logga ut" title="Logga ut" onClick={() => supabase?.auth.signOut()}>E</button></header>
    <nav className="tabs" aria-label="Huvudmeny"><button className={tab === "routines" ? "active" : ""} onClick={() => setTab("routines")}>Rutiner</button><button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}>Aktuella tasks</button><button className={tab === "library" ? "active" : ""} onClick={() => setTab("library")}>Bibliotek</button></nav>
    {message && <p className="alert" role="status">{message}</p>}
    {tab === "routines" ? <section className="content routine-list" aria-label="Dagens rutiner">
      <div className="section-heading routine-heading"><div><p className="eyebrow">Idag</p><h2>Dina rutiner</h2></div><span>Ett steg i taget</span></div>
      {activeRoutines.length === 0 ? <div className="focus-card routines-complete"><span aria-hidden="true">✨</span><h2>Bra jobbat!</h2><p>Alla dagens rutiner är klara. Nu får du känna dig nöjd.</p></div> : activeRoutines.map((routine) => {
        const done = routine.steps.filter((step) => routineCompleted.has(step.id)).length;
        const routineProgress = Math.round((done / routine.steps.length) * 100);
        return <article className="routine-card" key={routine.id}>
          <div className="routine-card-heading"><span className="routine-icon" aria-hidden="true">{routine.icon}</span><div><h2>{routine.title}</h2><p>{routine.subtitle}</p></div><strong>{done}/{routine.steps.length}</strong></div>
          <div className="progress-track" aria-label={`${routineProgress} procent klart`}><span style={{ width: `${routineProgress}%` }} /></div>
          <div className="step-list">{routine.steps.map((step) => {
            const completed = routineCompleted.has(step.id);
            return <label className={completed ? "step done" : "step"} key={step.id}><input type="checkbox" checked={completed} onChange={() => toggleRoutineStep(step.id)} /><span className="checkmark" aria-hidden="true">{completed ? "✓" : ""}</span><span>{step.title}</span></label>;
          })}</div>
        </article>;
      })}
    </section> : tab === "today" ? <section className="content" aria-label="Aktuella uppgifter">
      {tasks.length > 1 && <section className="task-overview" aria-label="Välj aktuell task"><h2>Dina aktuella tasks</h2><div className="task-switcher">{tasks.map((item) => {
        const itemTemplate = templates.find((candidate) => candidate.id === item.template_id);
        const itemDone = item.subtasks.filter((step) => step.completed).length;
        return <button className={item.id === selectedTaskId ? "task-pill active" : "task-pill"} key={item.id} onClick={() => setSelectedTaskId(item.id)}><span className="task-pill-icon">{itemTemplate?.icon ?? "✓"}</span><span className="task-pill-title">{item.title}</span><span className="task-pill-progress">{itemDone} av {item.subtasks.length}</span></button>;
      })}</div></section>}
      {!task ? <EmptyState onChoose={() => setTab("library")} /> : <><div className="focus-card">
        <div className="focus-heading"><div className="task-icon" aria-hidden="true">{template?.icon ?? "✓"}</div><div><p className="room-label">{task.category}{task.estimated_minutes ? ` · cirka ${task.estimated_minutes} min` : ""}</p><h2>{task.title}</h2></div><span className="progress-number">{progress}%</span></div>
        <div className="progress-track" aria-label={`${progress} procent klart`}><span style={{ width: `${progress}%` }} /></div>
        {progress === 100 ? <div className="complete-message"><span>✨</span><strong>Klart! Snyggt jobbat.</strong></div> : nextStep && <div className="next-up"><span>Nästa lilla steg</span><strong>{nextStep.title}</strong></div>}
        <div className="step-list">{task.subtasks.map((step) => <label className={step.completed ? "step done" : "step"} key={step.id}><input type="checkbox" checked={step.completed} onChange={() => toggleStep(step)} /><span className="checkmark" aria-hidden="true">{step.completed ? "✓" : ""}</span><span>{step.title}</span></label>)}</div>
      </div><button className="archive-action" onClick={() => setConfirmArchive(true)}><span aria-hidden="true">✓</span> Avsluta task</button></>}
      <button className="secondary-action" onClick={() => setTab("library")}><span aria-hidden="true">＋</span> Lägg till ny städuppgift</button>
    </section> : <section className="content library" aria-label="Bibliotek">
      <div className="section-heading"><div><p className="eyebrow">Dagens rutiner</p><h2>Lägg tillbaka en rutin</h2></div></div>
      <div className="routine-library">{routines.map((routine) => {
        const completed = routine.steps.every((step) => routineCompleted.has(step.id));
        return <button className="template-card" disabled={busy || !completed} key={routine.id} onClick={() => restoreRoutine(routine)}><span className="template-icon" aria-hidden="true">{routine.icon}</span><span className="template-copy"><strong>{routine.title}</strong><small>{completed ? "Klar idag · lägg tillbaka" : "Finns redan bland dagens rutiner"}</small></span><span className="arrow" aria-hidden="true">{completed ? "＋" : "✓"}</span></button>;
      })}</div>
      <div className="section-heading library-section-heading"><div><p className="eyebrow">Städuppgifter</p><h2>Vad vill du ta tag i?</h2></div><span>{templates.length} val</span></div>
      <div className="template-grid">{templates.map((item) => <button disabled={busy} className="template-card" key={item.id} onClick={() => createFromTemplate(item)}><span className="template-icon" aria-hidden="true">{item.icon}</span><span className="template-copy"><strong>{item.title}</strong><small>{item.steps.length} små steg · {item.minutes} min</small></span><span className="arrow" aria-hidden="true">›</span></button>)}</div>
      <p className="library-note">Rutiner och städmallar ligger direkt i appen. Dina val och framsteg sparas i Supabase.</p>
    </section>}
    <footer className="bottom-note"><span className="status-dot" /> Synkroniserad med Supabase</footer>
    {confirmArchive && task && <div className="modal-backdrop" role="presentation" onMouseDown={() => setConfirmArchive(false)}><section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => event.stopPropagation()}><span className="modal-icon">🍃</span><h2 id="confirm-title">Avsluta tasken?</h2><p>Är du säker på att du vill ta bort <strong>{task.title}</strong> från dina aktuella tasks?</p><div className="modal-actions"><button className="modal-cancel" onClick={() => setConfirmArchive(false)}>Nej, behåll</button><button className="modal-confirm" disabled={busy} onClick={archiveTask}>{busy ? "Avslutar…" : "Ja, avsluta"}</button></div></section></div>}
    {completionMessage && <div className="modal-backdrop" role="presentation"><section className="confirm-modal celebration-modal" role="dialog" aria-modal="true" aria-labelledby="completion-title"><span className="modal-icon">✨</span><h2 id="completion-title">Tasken är klar!</h2><p>{completionMessage}</p><button className="primary-action modal-next" disabled={busy} onClick={archiveTask}>{busy ? "Sparar…" : "Gå vidare"}</button></section></div>}
    {routineCompletionMessage && <div className="modal-backdrop" role="presentation"><section className="confirm-modal celebration-modal" role="dialog" aria-modal="true" aria-labelledby="routine-completion-title"><span className="modal-icon">✨</span><h2 id="routine-completion-title">Rutinen är klar!</h2><p>{routineCompletionMessage}</p><button className="primary-action modal-next" onClick={() => setRoutineCompletionMessage(null)}>Gå vidare</button></section></div>}
  </main>;
}

function SetupScreen() { return <main className="center-screen"><section className="auth-card"><span className="auth-icon">⚙️</span><p className="eyebrow">Ett steg kvar</p><h1>Koppla Supabase</h1><p>Lägg Project URL och Publishable key i filen <code>.env.local</code> och starta sedan om appen.</p></section></main>; }
function EmptyState({ onChoose }: { onChoose: () => void }) { return <div className="focus-card empty-state"><span>🌱</span><h2>Ingen aktiv task ännu</h2><p>Välj en lagom uppgift ur städbiblioteket.</p><button className="primary-action" onClick={onChoose}>Öppna biblioteket</button></div>; }
function LoginScreen({ email, setEmail, message, busy, onSubmit }: { email: string; setEmail: (value: string) => void; message: string; busy: boolean; onSubmit: (event: React.FormEvent) => void }) { return <main className="center-screen"><section className="auth-card"><span className="auth-icon">🌿</span><p className="eyebrow">Välkommen till</p><h1>Emels Tasks</h1><p>Logga in med din e-post. Du får en säker engångslänk och behöver inget lösenord.</p><form onSubmit={onSubmit}><label htmlFor="email">E-postadress</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="emelie@example.com" /><button className="primary-action" disabled={busy}>{busy ? "Skickar…" : "Skicka inloggningslänk"}</button></form>{message && <p className="alert" role="status">{message}</p>}</section></main>; }
