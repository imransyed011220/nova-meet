/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeetingNote, AnalyticsData } from '../types';

const STORAGE_KEY = 'ai_meeting_notes';

// Safe localStorage write with quota overflow handling
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn('localStorage quota exceeded — trimming oldest notes');
      // Try removing oldest notes to reclaim space
      try {
        const notes: MeetingNote[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (notes.length > 1) {
          const trimmed = notes.slice(0, Math.ceil(notes.length * 0.75));
          localStorage.setItem(key, JSON.stringify(trimmed));
          // Retry the original write
          localStorage.setItem(key, value);
          return true;
        }
      } catch { /* exhausted — fall through */ }
    }
    console.error('localStorage write failed:', e);
    return false;
  }
}

export const storageService = {
  getNotes: (): MeetingNote[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveNote: (note: MeetingNote) => {
    const notes = storageService.getNotes();
    const updatedNotes = [note, ...notes];
    safeSetItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return updatedNotes;
  },

  updateNote: (id: string, updates: Partial<MeetingNote>) => {
    const notes = storageService.getNotes();
    const updatedNotes = notes.map(n => n.id === id ? { ...n, ...updates } : n);
    safeSetItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return updatedNotes;
  },

  deleteNote: (id: string) => {
    const notes = storageService.getNotes();
    const updatedNotes = notes.filter(n => n.id !== id);
    safeSetItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return updatedNotes;
  },

  getAnalytics: (): AnalyticsData => {
    const notes = storageService.getNotes();
    
    let totalDurationSeconds = 0;
    const keywordsMap: Record<string, number> = {};

    notes.forEach(note => {
      // Parse duration
      if (typeof note.duration === 'number') {
        totalDurationSeconds += note.duration;
      } else if (typeof note.duration === 'string' && note.duration.includes(':')) {
        const parts = note.duration.split(':').map(Number);
        if (parts.length === 2) {
          totalDurationSeconds += (parts[0] * 60) + parts[1];
        }
      } else if (typeof note.duration === 'string') {
        totalDurationSeconds += parseFloat(note.duration) || 0;
      }

      // Use extracted keywords if available, otherwise fallback to simple extraction
      if (note.keywords && note.keywords.length > 0) {
        note.keywords.forEach(word => {
          const lowerWord = word.toLowerCase();
          keywordsMap[lowerWord] = (keywordsMap[lowerWord] || 0) + 1;
        });
      } else {
        const words = note.summary.toLowerCase().match(/\b(\w{5,})\b/g) || [];
        words.forEach(word => {
          keywordsMap[word] = (keywordsMap[word] || 0) + 1;
        });
      }
    });

    const commonKeywords = Object.entries(keywordsMap)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalMeetings: notes.length,
      totalRecordings: notes.filter(n => n.type === 'recording').length,
      totalUploads: notes.filter(n => n.type === 'upload').length,
      totalDurationSeconds,
      commonKeywords
    };
  }
};
