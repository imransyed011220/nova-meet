import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MeetingNote, AnalyticsData } from '../types';
import { storageService } from '../services/storageService';

// Firestore rejects `undefined` values — strip them before saving
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }
  return cleaned;
}

export const useMeetingHistory = () => {
  const { user } = useUser();
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    // 1. Load from localStorage (Instant)
    const localNotes = storageService.getNotes();
    setNotes(localNotes);
    setAnalytics(storageService.getAnalytics());

    // 2. Sync from Firestore if user is logged in
    if (user?.id) {
      setIsLoading(true);
      try {
        const q = query(collection(db, "meetings"), where("userId", "==", user.id));
        const querySnapshot = await getDocs(q);
        const firestoreNotes: MeetingNote[] = [];
        querySnapshot.forEach((doc) => {
          firestoreNotes.push({ ...doc.data() as MeetingNote, id: doc.id });
        });

        if (firestoreNotes.length > 0) {
          // Update local with firestore (merge)
          const merged = [...firestoreNotes];
          localStorage.setItem('ai_meeting_notes', JSON.stringify(merged));
          setNotes(merged);
          setAnalytics(storageService.getAnalytics());
        }
      } catch (error) {
        console.error("Firestore Load Error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addNote = async (note: MeetingNote) => {
    // Save locally first
    const updated = storageService.saveNote(note);
    setNotes(updated);
    setAnalytics(storageService.getAnalytics());

    // Sync to Firestore
    if (user?.id) {
      try {
        await setDoc(doc(db, "meetings", note.id), sanitizeForFirestore({
          ...note,
          userId: user.id,
          updatedAt: new Date().toISOString()
        }));
      } catch (error) {
        console.error("Firestore Save Error:", error);
      }
    }
  };

  const updateNote = async (id: string, updates: Partial<MeetingNote>) => {
    const updated = storageService.updateNote(id, updates);
    setNotes(updated);

    if (user?.id) {
      try {
        await updateDoc(doc(db, "meetings", id), sanitizeForFirestore({
          ...updates,
          updatedAt: new Date().toISOString()
        }));
      } catch (error) {
        console.error("Firestore Update Error:", error);
      }
    }
  };

  const deleteNote = async (id: string) => {
    const updated = storageService.deleteNote(id);
    setNotes(updated);
    setAnalytics(storageService.getAnalytics());

    if (user?.id) {
      try {
        await deleteDoc(doc(db, "meetings", id));
      } catch (error) {
        console.error("Firestore Delete Error:", error);
      }
    }
  };

  return {
    notes,
    analytics,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    refresh
  };
};
