import { templates } from "@/lib/app-data";
import type { Subtask, Task } from "@/lib/types";

type Props = {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelect: (id: string) => void;
  onToggleStep: (step: Subtask) => void;
  onArchive: () => void;
  onOpenLibrary: () => void;
};

export function TaskView({ tasks, selectedTaskId, onSelect, onToggleStep, onArchive, onOpenLibrary }: Props) {
  const task = tasks.find((item) => item.id === selectedTaskId) ?? null;
  const template = templates.find((item) => item.id === task?.template_id);
  const completedCount = task?.subtasks.filter((step) => step.completed).length ?? 0;
  const progress = task?.subtasks.length ? Math.round((completedCount / task.subtasks.length) * 100) : 0;
  const nextStep = task?.subtasks.find((step) => !step.completed);

  return <section className="content" aria-label="Aktuella uppgifter">
    {tasks.length > 1 && <section className="task-overview" aria-label="Välj aktuell task"><h2>Dina aktuella tasks</h2><div className="task-switcher">{tasks.map((item) => {
      const itemTemplate = templates.find((candidate) => candidate.id === item.template_id);
      const itemDone = item.subtasks.filter((step) => step.completed).length;
      return <button className={item.id === selectedTaskId ? "task-pill active" : "task-pill"} key={item.id} onClick={() => onSelect(item.id)}><span className="task-pill-icon">{itemTemplate?.icon ?? "✓"}</span><span className="task-pill-title">{item.title}</span><span className="task-pill-progress">{itemDone} av {item.subtasks.length}</span></button>;
    })}</div></section>}
    {!task ? <EmptyState onChoose={onOpenLibrary} /> : <><div className="focus-card">
      <div className="focus-heading"><div className="task-icon" aria-hidden="true">{template?.icon ?? "✓"}</div><div><p className="room-label">{task.category}{task.estimated_minutes ? ` · cirka ${task.estimated_minutes} min` : ""}</p><h2>{task.title}</h2></div><span className="progress-number">{progress}%</span></div>
      <div className="progress-track" aria-label={`${progress} procent klart`}><span style={{ width: `${progress}%` }} /></div>
      {progress === 100 ? <div className="complete-message"><span>✨</span><strong>Klart! Snyggt jobbat.</strong></div> : nextStep && <div className="next-up"><span>Nästa lilla steg</span><strong>{nextStep.title}</strong></div>}
      <div className="step-list">{task.subtasks.map((step) => <label className={step.completed ? "step done" : "step"} key={step.id}><input type="checkbox" checked={step.completed} onChange={() => onToggleStep(step)} /><span className="checkmark" aria-hidden="true">{step.completed ? "✓" : ""}</span><span>{step.title}</span></label>)}</div>
    </div><button className="archive-action" onClick={onArchive}><span aria-hidden="true">✓</span> Avsluta task</button></>}
    <button className="secondary-action" onClick={onOpenLibrary}><span aria-hidden="true">＋</span> Lägg till ny städuppgift</button>
  </section>;
}

function EmptyState({ onChoose }: { onChoose: () => void }) {
  return <div className="focus-card empty-state"><span>🌱</span><h2>Ingen aktiv task ännu</h2><p>Välj en lagom uppgift ur biblioteket.</p><button className="primary-action" onClick={onChoose}>Öppna biblioteket</button></div>;
}
