export type AppTab = "routines" | "today" | "library";

export type Template = {
  id: string;
  title: string;
  room: string;
  minutes: number;
  icon: string;
  steps: string[];
};

export type Subtask = {
  id: string;
  title: string;
  position: number;
  completed: boolean;
};

export type Task = {
  id: string;
  template_id: string | null;
  title: string;
  category: string;
  estimated_minutes: number | null;
  completed: boolean;
  subtasks: Subtask[];
};

export type Routine = {
  id: string;
  title: string;
  icon: string;
  subtitle: string;
  steps: { id: string; title: string }[];
};
