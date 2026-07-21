import type { StorageAdapter } from "grammy";
import { resolveSessionStorage } from "./toolkit/index.js";

export interface Cut {
  start: string;
  end: string;
}

export interface Overlay {
  type: "text" | "watermark" | "music";
  content: string;
}

export interface Project {
  id: string;
  chatId: number;
  videoFileId?: string;
  fileName?: string;
  videoWidth?: number;
  videoHeight?: number;
  cuts: Cut[];
  overlays: Overlay[];
  createdAt: number;
  updatedAt: number;
}

export function now(): number {
  return Date.now();
}

const projectStore: StorageAdapter<Project[]> = resolveSessionStorage<Project[]>(undefined);

export async function getProjects(chatId: number): Promise<Project[]> {
  return (await projectStore.read(String(chatId))) ?? [];
}

export async function saveProject(chatId: number, project: Project): Promise<void> {
  const projects = await getProjects(chatId);
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  await projectStore.write(String(chatId), projects);
}

export async function getProject(chatId: number, projectId: string): Promise<Project | undefined> {
  const projects = await getProjects(chatId);
  return projects.find((p) => p.id === projectId);
}

export async function deleteProject(chatId: number, projectId: string): Promise<boolean> {
  const projects = await getProjects(chatId);
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx < 0) return false;
  projects.splice(idx, 1);
  await projectStore.write(String(chatId), projects);
  return true;
}

let counter = 0;
export function generateProjectId(): string {
  return `${now().toString(36)}-${(++counter).toString(36)}`;
}
