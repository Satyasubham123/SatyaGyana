import { db } from '../lib/firebase';
import { 
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc, 
  query, where, orderBy, serverTimestamp 
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

const CONVERSATIONS_COLLECTION = 'aiConversations';

export const chatService = {
  
  async createChat(userId: string, title: string = "New Chat", isTemporary: boolean = false): Promise<string> {
    try {
      if (!userId) throw new Error("Missing User ID");
      
      const chatsRef = collection(db, CONVERSATIONS_COLLECTION);
      
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      const docRef = await addDoc(chatsRef, {
        userId, 
        title,
        isTemporary,
        createdAt: serverTimestamp(),
        expiresAt: expirationDate 
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
  },

  async getUserChats(userId: string): Promise<ChatSession[]> {
    try {
      const chatsRef = collection(db, CONVERSATIONS_COLLECTION);
      
      const q = query(
        chatsRef, 
        where('userId', '==', userId), 
        where('isTemporary', '==', false),
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

  async saveMessage(chatId: string, sender: 'user' | 'ai', text: string, imageUrl?: string) {
    try {
      if (chatId === 'temporary-session') return;

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      const messagesRef = collection(db, CONVERSATIONS_COLLECTION, chatId, 'messages');
      await addDoc(messagesRef, {
        sender,
        text,
        imageUrl: imageUrl || null,
        timestamp: serverTimestamp(),
        expiresAt: expirationDate
      });
    } catch (error) {
      console.error("Error saving message:", error);
      throw error; // Re-throw to help UI handle the failure state
    }
  },

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    try {
      if (chatId === 'temporary-session') return [];
      
      const messagesRef = collection(db, CONVERSATIONS_COLLECTION, chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
    } catch (error) {
      console.error("Error loading messages:", error);
      return [];
    }
  },

  async renameChat(chatId: string, newTitle: string) {
    try {
      const chatDocRef = doc(db, CONVERSATIONS_COLLECTION, chatId);
      await updateDoc(chatDocRef, { title: newTitle });
    } catch (error) {
      console.error("Error renaming chat:", error);
      throw error;
    }
  },

  async deleteChat(chatId: string) {
    try {
      const chatDocRef = doc(db, CONVERSATIONS_COLLECTION, chatId);
      await deleteDoc(chatDocRef);
    } catch (error) {
      console.error("Error deleting chat:", error);
      throw error;
    }
  }
};