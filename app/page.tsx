"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppNavigation } from "@/components/app-navigation";
import { ArchiveDialog, CompletionDialog } from "@/components/app-dialogs";
import { LoginScreen, SetupScreen } from "@/components/auth-screens";
import { LibraryView } from "@/components/library-view";
import { RoutineView } from "@/components/routine-view";
import { TaskView } from "@/components/task-view";
import { randomCompliment, routines, todayKey } from "@/lib/app-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AppTab, Routine, Subtask, Task, Template } from "@/lib/types";

export default function Home() {
  // Inloggningsstate. `user` innehåller Supabase-användaren när en giltig
  // session finns. `authReady` hindrar inloggningssidan från att blinka till
  // medan Supabase kontrollerar en redan sparad session.
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [email, setEmail] = useState("");

  // Gemensam status för fel/information och knappar som väntar på Supabase.
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Aktuella städtasks hämtas från databasen. ID:t avgör vilken av dem som
  // visas i den stora checklistan när flera tasks är aktiva samtidigt.
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Popup-state hålls här eftersom popup-rutorna påverkas av databasresultat.
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [routineCompletionMessage, setRoutineCompletionMessage] = useState<string | null>(null);

  // Rutinerna själva är kodade i app-data.ts. Databasen sparar bara ID:n för
  // de steg som är klara idag. Set ger en snabb kontroll med `.has(itemId)`.
  const [routineCompleted, setRoutineCompleted] = useState<Set<string>>(new Set());
  const [currentDay, setCurrentDay] = useState(todayKey);

  // Styr vilket av de tre huvudlägena som visas.
  const [tab, setTab] = useState<AppTab>("routines");

  // Hämtar alla oarkiverade tasks som tillhör den inloggade användaren.
  // RLS i Supabase gör att frågan aldrig kan returnera någon annans data.
  const loadTasks = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("tasks")
      .select("id, template_id, title, category, estimated_minutes, completed, subtasks(id, title, position, completed)")
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .order("position", { referencedTable: "subtasks", ascending: true });
    if (error) setMessage(error.message);
    else {
      const activeTasks = (data ?? []) as Task[];
      setTasks(activeTasks);

      // Behåll den valda tasken om den fortfarande är aktuell. Om den har
      // arkiverats väljs den första återstående tasken automatiskt.
      setSelectedTaskId((current) => activeTasks.some((item) => item.id === current) ? current : activeTasks[0]?.id ?? null);
    }
  }, []);

  // Hämtar endast dagens avbockningar. Äldre datum ligger kvar i databasen
  // som historik men påverkar inte checklistorna för den aktuella dagen.
  const loadRoutineCompletions = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("routine_completions").select("item_id").eq("completed_on", currentDay);
    if (error) setMessage(error.message);
    else setRoutineCompleted(new Set((data ?? []).map((item) => item.item_id as string)));
  }, [currentDay]);

  // Kör en gång när sidan monteras. Först återställs eventuell sparad session,
  // därefter lyssnar appen på framtida in- och utloggningar.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setAuthReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) { setTasks([]); setRoutineCompleted(new Set()); }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // När användaren eller datumet ändras laddas användarens aktuella data.
  // Timeouten flyttar uppdateringen utanför själva effect-körningen.
  useEffect(() => {
    if (!user) return;
    const timeout = window.setTimeout(() => { void loadTasks(); void loadRoutineCompletions(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [user, loadTasks, loadRoutineCompletions]);

  // En PWA kan ligga öppen över midnatt eller väckas från bakgrunden. Därför
  // kontrolleras datumet varje minut och varje gång webbsidan byter synlighet.
  // När `currentDay` ändras kör effecten ovan och laddar den nya dagens rutiner.
  useEffect(() => {
    const refreshDay = () => setCurrentDay(todayKey());
    const interval = window.setInterval(refreshDay, 60_000);
    document.addEventListener("visibilitychange", refreshDay);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", refreshDay); };
  }, []);

  // Härleds från befintlig state i stället för att lagras separat. Det undviker
  // att två kopior av samma information hamnar ur synk.
  const selectedTask = tasks.find((item) => item.id === selectedTaskId) ?? null;

  // Ber Supabase Auth skicka en magic link. Länken skickar tillbaka användaren
  // till samma domän, både på localhost och på den driftsatta Vercel-sidan.
  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? error.message : "Vi har skickat en inloggningslänk till din e-post.");
    setBusy(false);
  }

  // Skapar först huvudtasken och därefter alla delmål från den kodade mallen.
  // När båda anropen är klara laddas tasklistan om och den nya tasken väljs.
  async function createFromTemplate(selected: Template) {
    if (!supabase || !user) return;
    setBusy(true); setMessage("");
    const { data: created, error } = await supabase.from("tasks").insert({ user_id: user.id, template_id: selected.id, title: selected.title, category: selected.room, estimated_minutes: selected.minutes }).select("id").single();
    if (error) { setMessage(error.message); setBusy(false); return; }
    const { error: stepError } = await supabase.from("subtasks").insert(selected.steps.map((title, position) => ({ task_id: created.id, user_id: user.id, title, position })));
    if (stepError) setMessage(stepError.message);
    await loadTasks();
    setSelectedTaskId(created.id); setTab("today"); setBusy(false);
  }

  // Bockar av eller återställer ett rutinsteg för dagens datum.
  async function toggleRoutineStep(itemId: string) {
    if (!supabase || !user) return;
    const wasCompleted = routineCompleted.has(itemId);
    const selectedRoutine = routines.find((routine) => routine.steps.some((step) => step.id === itemId));
    const completesRoutine = !wasCompleted && selectedRoutine?.steps.every((step) => step.id === itemId || routineCompleted.has(step.id));

    // Optimistisk uppdatering: gränssnittet reagerar direkt utan att invänta
    // nätverket. Vid databasfel laddas det korrekta läget tillbaka nedan.
    setRoutineCompleted((current) => {
      const next = new Set(current);
      if (wasCompleted) next.delete(itemId); else next.add(itemId);
      return next;
    });
    const { error } = wasCompleted
      // En avbockning representeras av en databasrad. Att ångra steget tar
      // därför bort dagens rad; att bocka av skapar eller uppdaterar den.
      ? await supabase.from("routine_completions").delete().eq("user_id", user.id).eq("item_id", itemId).eq("completed_on", currentDay)
      : await supabase.from("routine_completions").upsert({ user_id: user.id, item_id: itemId, completed_on: currentDay });
    if (error) { setMessage(error.message); await loadRoutineCompletions(); }
    else if (completesRoutine) setRoutineCompletionMessage(randomCompliment());
  }

  // Gör en redan färdig rutin aktiv igen genom att radera dagens avbockningar
  // för just den rutinens steg. Själva rutinmallen påverkas inte.
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

  // Uppdaterar ett delmål i en vanlig task. Även här ändras gränssnittet först
  // och återställs från databasen om Supabase-anropet misslyckas.
  async function toggleStep(step: Subtask) {
    if (!supabase || !selectedTask) return;
    const completesTask = !step.completed && selectedTask.subtasks.every((item) => item.id === step.id || item.completed);
    setTasks((current) => current.map((item) => item.id === selectedTask.id ? { ...item, subtasks: item.subtasks.map((subtask) => subtask.id === step.id ? { ...subtask, completed: !subtask.completed } : subtask) } : item));
    const { error } = await supabase.from("subtasks").update({ completed: !step.completed }).eq("id", step.id);
    if (error) { setMessage(error.message); await loadTasks(); }
    else if (completesTask) setCompletionMessage(randomCompliment());
  }

  // “Avsluta” betyder arkivera, inte permanent radera. Tasken finns därför
  // kvar i databasen men tas bort från listan över aktuella tasks.
  async function archiveTask() {
    if (!supabase || !selectedTask) return;
    setBusy(true);
    const { error } = await supabase.from("tasks").update({ archived: true, updated_at: new Date().toISOString() }).eq("id", selectedTask.id);
    if (error) setMessage(error.message);
    else { await loadTasks(); setCompletionMessage(null); }
    setConfirmArchive(false); setBusy(false);
  }

  // Tidiga returer håller huvudvyn enkel: konfigurationsfel, laddning och
  // inloggning hanteras innan den autentiserade appen renderas.
  if (!isSupabaseConfigured) return <SetupScreen />;
  if (!authReady) return <main className="center-screen"><p>Laddar…</p></main>;
  if (!user) return <LoginScreen email={email} setEmail={setEmail} message={message} busy={busy} onSubmit={sendMagicLink} />;

  // Komponenterna nedan visar bara data och skickar användarens handlingar
  // tillbaka som callbacks. All kommunikation med Supabase stannar i page.tsx.
  return <main className="app-shell">
    <header className="topbar"><div><p className="eyebrow">Din lugna tasklista</p><h1>Hej Emelie <span aria-hidden="true">👋</span></h1><p className="intro">Ett litet steg i taget räcker.</p></div><button className="avatar" aria-label="Logga ut" title="Logga ut" onClick={() => supabase?.auth.signOut()}>E</button></header>
    <AppNavigation tab={tab} onChange={setTab} />
    {message && <p className="alert" role="status">{message}</p>}
    {tab === "routines" && <RoutineView routines={routines} completed={routineCompleted} onToggle={toggleRoutineStep} />}
    {tab === "today" && <TaskView tasks={tasks} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} onToggleStep={toggleStep} onArchive={() => setConfirmArchive(true)} onOpenLibrary={() => setTab("library")} />}
    {tab === "library" && <LibraryView completed={routineCompleted} busy={busy} onRestoreRoutine={restoreRoutine} onCreateTask={createFromTemplate} />}
    <footer className="bottom-note"><span className="status-dot" /> Synkroniserad med Supabase</footer>

    {/* Popup-rutorna monteras bara när respektive state har ett aktivt värde. */}
    {confirmArchive && selectedTask && <ArchiveDialog task={selectedTask} busy={busy} onCancel={() => setConfirmArchive(false)} onConfirm={archiveTask} />}
    {completionMessage && <CompletionDialog title="Tasken är klar!" message={completionMessage} busy={busy} onContinue={archiveTask} />}
    {routineCompletionMessage && <CompletionDialog title="Rutinen är klar!" message={routineCompletionMessage} onContinue={() => setRoutineCompletionMessage(null)} />}
  </main>;
}
