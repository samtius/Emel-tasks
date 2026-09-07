import type { Routine, Template } from "./types";

export const templates: Template[] = [
  { id: "kitchen", title: "Städa köket", room: "Kök", minutes: 25, icon: "🍋", steps: ["Plocka undan", "Fyll diskmaskinen", "Torka bänkarna", "Rengör spisen", "Torka diskhon", "Dammsug golvet"] },
  { id: "bathroom", title: "Städa badrummet", room: "Badrum", minutes: 20, icon: "🫧", steps: ["Plocka undan", "Rengör handfatet", "Putsa spegeln", "Rengör toaletten", "Torka duschen", "Våttorka golvet"] },
  { id: "bedroom", title: "Fixa sovrummet", room: "Sovrum", minutes: 15, icon: "🌙", steps: ["Bädda sängen", "Lägg kläder på plats", "Plocka undan ytor", "Dammtorka", "Dammsug golvet"] },
  { id: "living-room", title: "Städa vardagsrummet", room: "Vardagsrum", minutes: 20, icon: "🌿", steps: ["Plocka undan", "Vik filtar", "Torka av bord", "Dammtorka", "Puffa kuddarna", "Dammsug golvet"] },
];

export const routines: Routine[] = [
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

export const compliments = [
  "Bra jobbat! Du tog dig hela vägen.",
  "Snyggt gjort! Nu kan du vara riktigt nöjd.",
  "Vilken insats! Alla små steg blev något stort.",
  "Du fixade det! Dags att njuta av resultatet.",
  "Fantastiskt jobbat! Ett steg i taget fungerade.",
];

export function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function randomCompliment() {
  return compliments[Math.floor(Math.random() * compliments.length)];
}
