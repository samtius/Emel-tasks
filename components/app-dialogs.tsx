import type { Task } from "@/lib/types";

export function ArchiveDialog({ task, busy, onCancel, onConfirm }: { task: Task; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop" role="presentation"><section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><span className="modal-icon">🍃</span><h2 id="confirm-title">Avsluta tasken?</h2><p>Är du säker på att du vill ta bort <strong>{task.title}</strong> från dina aktuella tasks?</p><div className="modal-actions"><button className="modal-cancel" onClick={onCancel}>Nej, behåll</button><button className="modal-confirm" disabled={busy} onClick={onConfirm}>{busy ? "Avslutar…" : "Ja, avsluta"}</button></div></section></div>;
}

export function CompletionDialog({ title, message, busy = false, onContinue }: { title: string; message: string; busy?: boolean; onContinue: () => void }) {
  return <div className="modal-backdrop" role="presentation"><section className="confirm-modal celebration-modal" role="dialog" aria-modal="true" aria-labelledby="completion-title"><span className="modal-icon">✨</span><h2 id="completion-title">{title}</h2><p>{message}</p><button className="primary-action modal-next" disabled={busy} onClick={onContinue}>{busy ? "Sparar…" : "Gå vidare"}</button></section></div>;
}
