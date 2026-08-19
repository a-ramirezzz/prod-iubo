// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz) — CC BY-NC-ND 4.0

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ENTRIES_DIR = path.join(process.cwd(), 'src/app/changelog/entries');

export interface ChangelogEntry {
  slug: string;
  title: string;
  date: string;
  version?: string;
  tags: string[];
  content: string;
}

export function getEntries(): ChangelogEntry[] {
  const filenames = fs.readdirSync(ENTRIES_DIR).filter((name) => name.endsWith('.mdx'));

  const entries = filenames.map((filename) => {
    const filePath = path.join(ENTRIES_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);
    const slug = filename.replace(/\.mdx$/, '');

    return {
      slug,
      title: data.title as string,
      date: data.date as string,
      version: data.version as string | undefined,
      tags: (data.tags as string[]) ?? [],
      content,
    };
  });

  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}
