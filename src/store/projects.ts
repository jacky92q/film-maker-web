import { create } from 'zustand';
import { newProject, normalizeProject, type Project } from '../domain/models';
import type { VideoOrientation } from '../domain/enums';

const LS_KEY = 'fm_projects';

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Project[];
    return list.map(normalizeProject).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (e) {
    console.error('Could not read saved films', e);
    return [];
  }
}

function persist(list: Project[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Could not save films', e);
  }
}

interface ProjectsState {
  projects: Project[];
  reload: () => void;
  create: (title: string, orientation: VideoOrientation) => Project;
  upsert: (project: Project) => void;
  rename: (id: string, title: string) => void;
  remove: (id: string) => void;
  duplicate: (id: string, copyLabel: string) => Project | undefined;
  getById: (id: string) => Project | undefined;
}

const byRecent = (a: Project, b: Project) => b.updatedAt.localeCompare(a.updatedAt);

export const useProjects = create<ProjectsState>((set, get) => ({
  projects: loadProjects(),

  reload: () => set({ projects: loadProjects() }),

  create: (title, orientation) => {
    const p = newProject(title.trim(), orientation);
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
    next.sort(byRecent);
    persist(next);
    set({ projects: next });
  },

  rename: (id, title) => {
    const next = get().projects.map((p) => (p.id === id ? { ...p, title, updatedAt: new Date().toISOString() } : p));
    next.sort(byRecent);
    persist(next);
    set({ projects: next });
  },

  remove: (id) => {
    const next = get().projects.filter((p) => p.id !== id);
    persist(next);
    set({ projects: next });
  },

  duplicate: (id, copyLabel) => {
    const src = get().projects.find((p) => p.id === id);
    if (!src) return undefined;
    const now = new Date().toISOString();
    const copy: Project = {
      ...structuredClone(src),
      id: crypto.randomUUID(),
      title: `${src.title} ${copyLabel}`,
      createdAt: now,
      updatedAt: now,
    };
    const next = [copy, ...get().projects];
    persist(next);
    set({ projects: next });
    return copy;
  },

  getById: (id) => get().projects.find((p) => p.id === id),
}));
