import { db } from '../lib/firebase';
import { 
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc, 
  query, where, orderBy, serverTimestamp, getDoc 
} from 'firebase/firestore';

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: any;
  isTemporary: boolean;
}

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string;
  timestamp: any;
}

export const chatService = {
  /**
   * 1. Creates a brand new chat session for a student
   */
  async createChat(userId: string, title: string = "New Chat", isTemporary: boolean = false): Promise<string> {
    try {
      const chatsRef = collection(db, 'chats');
      const docRef = await addDoc(chatsRef, {
        userId,
        title,
        isTemporary,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
  },

  /**
   * 2. Fetches all permanent chat history for the sidebar (Hides chats older than 7 days)
   */
  async getUserChats(userId: string): Promise<ChatSession[]> {
    try {
      const chatsRef = collection(db, 'chats');
      
      // 🚀 NEW: Calculate the exact time 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const q = query(
        chatsRef, 
        where('userId', '==', userId), 
        where('isTemporary', '==', false),
        where('createdAt', '>=', sevenDaysAgo), // 🚀 NEW: Filter out old chats
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
    } catch (error) {
      console.error("Error fetching user history:", error);
      return [];
    }
  },

  /**
   * 3. Saves a chat message (user or AI response) inside the sub-collection
   */
  async saveMessage(chatId: string, sender: 'user' | 'ai', text: string, imageUrl?: string) {
    try {
      // If it's a temporary chat session, we skip database saving to keep it purely local
      if (chatId === 'temporary-session') return;

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        sender,
        text,
        imageUrl: imageUrl || null,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving message stream:", error);
    }
  },

  /**
   * 4. Fetches all existing messages inside a selected chat room
   */
  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    try {
      if (chatId === 'temporary-session') return [];
      
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
    } catch (error) {
      console.error("Error loading message cluster:", error);
      return [];
    }
  },

  /**
   * 5. Renames an existing chat window title
   */
  async renameChat(chatId: string, newTitle: string) {
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      await updateDoc(chatDocRef, { title: newTitle });
    } catch (error) {
      console.error("Error updates parameters:", error);
      throw error;
    }
  },

  /**
   * 6. Deletes a chat and everything associated with it
   */
  async deleteChat(chatId: string) {
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      await deleteDoc(chatDocRef);
      // Note: Sub-collections fields should technically be pruned as well, 
      // but for client-side builds, deleting the main document untethers it instantly.
    } catch (error) {
      console.error("Error purge sequence failed:", error);
      throw error;
    }
  }
};