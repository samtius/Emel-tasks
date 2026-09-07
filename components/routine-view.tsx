import type { Routine } from "@/lib/types";

export function RoutineView({ routines, completed, onToggle }: { routines: Routine[]; completed: Set<string>; onToggle: (itemId: string) => void }) {
  const active = routines.filter((routine) => !routine.steps.every((step) => completed.has(step.id)));

  return <section className="content routine-list" aria-label="Dagens rutiner">
    <div className="section-heading routine-heading"><div><p className="eyebrow">Idag</p><h2>Dina rutiner</h2></div><span>Ett steg i taget</span></div>
    {active.length === 0 ? <div className="focus-card routines-complete"><span aria-hidden="true">✨</span><h2>Bra jobbat!</h2><p>Alla dagens rutiner är klara. Nu får du känna dig nöjd.</p></div> : active.map((routine) => <RoutineCard key={routine.id} routine={routine} completed={completed} onToggle={onToggle} />)}
  </section>;
}

function RoutineCard({ routine, completed, onToggle }: { routine: Routine; completed: Set<string>; onToggle: (itemId: string) => void }) {
  const done = routine.steps.filter((step) => completed.has(step.id)).length;
  const progress = Math.round((done / routine.steps.length) * 100);

  return <article className="routine-card">
    <div className="routine-card-heading"><span className="routine-icon" aria-hidden="true">{routine.icon}</span><div><h2>{routine.title}</h2><p>{routine.subtitle}</p></div><strong>{done}/{routine.steps.length}</strong></div>
    <div className="progress-track" aria-label={`${progress} procent klart`}><span style={{ width: `${progress}%` }} /></div>
    <div className="step-list">{routine.steps.map((step) => {
      const isCompleted = completed.has(step.id);
      return <label className={isCompleted ? "step done" : "step"} key={step.id}><input type="checkbox" checked={isCompleted} onChange={() => onToggle(step.id)} /><span className="checkmark" aria-hidden="true">{isCompleted ? "✓" : ""}</span><span>{step.title}</span></label>;
    })}</div>
  </article>;
}
