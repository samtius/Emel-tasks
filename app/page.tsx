"use client";

import { useMemo, useState } from "react";

type Template = {
  id: string;
  title: string;
  room: string;
  minutes: number;
  icon: string;
  steps: string[];
};

const templates: Template[] = [
  {
    id: "kitchen",
    title: "Städa köket",
    room: "Kök",
    minutes: 25,
    icon: "🍋",
    steps: ["Plocka undan", "Fyll diskmaskinen", "Torka bänkarna", "Rengör spisen", "Torka diskhon", "Dammsug golvet"],
  },
  {
    id: "bathroom",
    title: "Städa badrummet",
    room: "Badrum",
    minutes: 20,
    icon: "🫧",
    steps: ["Plocka undan", "Rengör handfatet", "Putsa spegeln", "Rengör toaletten", "Torka duschen", "Våttorka golvet"],
  },
  {
    id: "bedroom",
    title: "Fixa sovrummet",
    room: "Sovrum",
    minutes: 15,
    icon: "🌙",
    steps: ["Bädda sängen", "Lägg kläder på plats", "Plocka undan ytor", "Dammtorka", "Dammsug golvet"],
  },
  {
    id: "living-room",
    title: "Städa vardagsrummet",
    room: "Vardagsrum",
    minutes: 20,
    icon: "🌿",
    steps: ["Plocka undan", "Vik filtar", "Torka av bord", "Dammtorka", "Puffa kuddarna", "Dammsug golvet"],
  },
];

export default function Home() {
  const [selected, setSelected] = useState<Template>(templates[0]);
  const [done, setDone] = useState<Set<number>>(new Set([0]));
  const [tab, setTab] = useState<"today" | "library">("today");
  const progress = Math.round((done.size / selected.steps.length) * 100);
  const nextStep = useMemo(() => selected.steps.findIndex((_, index) => !done.has(index)), [done, selected]);

  function chooseTemplate(template: Template) {
    setSelected(template);
    setDone(new Set());
    setTab("today");
  }

  function toggleStep(index: number) {
    setDone((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Fredag 14 augusti</p>
          <h1>Hej Emelie <span aria-hidden="true">👋</span></h1>
          <p className="intro">Ett litet steg i taget räcker.</p>
        </div>
        <button className="avatar" aria-label="Öppna profil">E</button>
      </header>

      <nav className="tabs" aria-label="Huvudmeny">
        <button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}>Idag</button>
        <button className={tab === "library" ? "active" : ""} onClick={() => setTab("library")}>Städbibliotek</button>
      </nav>

      {tab === "today" ? (
        <section className="content" aria-label="Dagens uppgift">
          <div className="focus-card">
            <div className="focus-heading">
              <div className="task-icon" aria-hidden="true">{selected.icon}</div>
              <div>
                <p className="room-label">{selected.room} · cirka {selected.minutes} min</p>
                <h2>{selected.title}</h2>
              </div>
              <span className="progress-number">{progress}%</span>
            </div>
            <div className="progress-track" aria-label={`${progress} procent klart`}>
              <span style={{ width: `${progress}%` }} />
            </div>

            {progress === 100 ? (
              <div className="complete-message"><span>✨</span><strong>Klart! Snyggt jobbat.</strong></div>
            ) : (
              <div className="next-up">
                <span>Nästa lilla steg</span>
                <strong>{selected.steps[nextStep]}</strong>
              </div>
            )}

            <div className="step-list">
              {selected.steps.map((step, index) => (
                <label className={done.has(index) ? "step done" : "step"} key={step}>
                  <input type="checkbox" checked={done.has(index)} onChange={() => toggleStep(index)} />
                  <span className="checkmark" aria-hidden="true">{done.has(index) ? "✓" : ""}</span>
                  <span>{step}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="secondary-action" onClick={() => setTab("library")}>
            <span aria-hidden="true">＋</span> Välj en annan städuppgift
          </button>
        </section>
      ) : (
        <section className="content library" aria-label="Städbibliotek">
          <div className="section-heading">
            <div><p className="eyebrow">Färdiga mallar</p><h2>Vad vill du ta tag i?</h2></div>
            <span>{templates.length} val</span>
          </div>
          <div className="template-grid">
            {templates.map((template) => (
              <button className="template-card" key={template.id} onClick={() => chooseTemplate(template)}>
                <span className="template-icon" aria-hidden="true">{template.icon}</span>
                <span className="template-copy">
                  <strong>{template.title}</strong>
                  <small>{template.steps.length} små steg · {template.minutes} min</small>
                </span>
                <span className="arrow" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
          <p className="library-note">Mallarna ligger direkt i appen och finns alltid tillgängliga.</p>
        </section>
      )}

      <footer className="bottom-note"><span className="status-dot" /> Lokal förhandsversion</footer>
    </main>
  );
}
