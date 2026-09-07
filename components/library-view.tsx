import { routines, templates } from "@/lib/app-data";
import type { Routine, Template } from "@/lib/types";

export function LibraryView({ completed, busy, onRestoreRoutine, onCreateTask }: { completed: Set<string>; busy: boolean; onRestoreRoutine: (routine: Routine) => void; onCreateTask: (template: Template) => void }) {
  return <section className="content library" aria-label="Bibliotek">
    <div className="section-heading"><div><p className="eyebrow">Dagens rutiner</p><h2>Lägg tillbaka en rutin</h2></div></div>
    <div className="routine-library">{routines.map((routine) => {
      const isCompleted = routine.steps.every((step) => completed.has(step.id));
      return <button className="template-card" disabled={busy || !isCompleted} key={routine.id} onClick={() => onRestoreRoutine(routine)}><span className="template-icon" aria-hidden="true">{routine.icon}</span><span className="template-copy"><strong>{routine.title}</strong><small>{isCompleted ? "Klar idag · lägg tillbaka" : "Finns redan bland dagens rutiner"}</small></span><span className="arrow" aria-hidden="true">{isCompleted ? "＋" : "✓"}</span></button>;
    })}</div>
    <div className="section-heading library-section-heading"><div><p className="eyebrow">Städuppgifter</p><h2>Vad vill du ta tag i?</h2></div><span>{templates.length} val</span></div>
    <div className="template-grid">{templates.map((item) => <button disabled={busy} className="template-card" key={item.id} onClick={() => onCreateTask(item)}><span className="template-icon" aria-hidden="true">{item.icon}</span><span className="template-copy"><strong>{item.title}</strong><small>{item.steps.length} små steg · {item.minutes} min</small></span><span className="arrow" aria-hidden="true">›</span></button>)}</div>
    <p className="library-note">Rutiner och städmallar ligger direkt i appen. Dina val och framsteg sparas i Supabase.</p>
  </section>;
}
