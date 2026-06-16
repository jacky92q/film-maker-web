import { create } from 'zustand';
import { newProject, type Project } from '../domain/models';
import type { VideoOrientation } from '../domain/enums';

const LS_KEY = 'fm_projects';

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Project[];
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

function persist(list: Project[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to persist projects', e);
  }
}

interface ProjectsState {
  projects: Project[];
  reload: () => void;
  create: (title: string, orientation: VideoOrientation) => Project;
  upsert: (project: Project) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  getById: (id: string) => Project | undefined;
}

export const useProjects = create<ProjectsState>((set, get) => ({
  projects: loadProjects(),
  reload: () => set({ projects: loadProjects() }),
  create: (title, orientation) => {
    const p = newProject(title || 'Untitled Film', orientation);
    const next = [p, ...get().projects];
    persist(next);
    set({ projects: next });
    return p;
  },
  upsert: (project) => {
    const stamped = { ...project, updatedAt: new Date().toISOString() };
    const list = get().projects;
    const idx = list.findIndex((p) => p.id === project.id);
    const next = idx >= 0 ? list.map((p) => (p.id === project.id ? stamped : p)) : [stamped, ...list];
    next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    persist(next);
    set({ projects: next });
  },
  remove: (id) => {
    const next = get().projects.filter((p) => p.id !== id);
    persist(next);
    set({ projects: next });
  },
  duplicate: (id) => {
    const src = get().projects.find((p) => p.id === id);
    if (!src) return;
    const now = new Date().toISOString();
    const copy: Project = {
      ...structuredClone(src),
      id: crypto.randomUUID(),
      title: `${src.title} copy`,
      createdAt: now,
      updatedAt: now,
    };
    const next = [copy, ...get().projects];
    persist(next);
    set({ projects: next });
  },
  getById: (id) => get().projects.find((p) => p.id === id),
}));
