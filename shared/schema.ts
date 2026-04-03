export interface Project {
  id: number;
  title: string;
  description?: string;
  language?: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type InsertProject = Omit<Project, "id" | "createdAt" | "updatedAt">;

export interface Folder {
  id: number;
  name: string;
  projectIds?: number[];
  createdAt?: string;
}

export type InsertFolder = Omit<Folder, "id" | "createdAt">;
