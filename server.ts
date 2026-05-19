import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import Razorpay from 'razorpay';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFirebaseAdminApp() {
  const existingApps = getApps();
  if (existingApps.length > 0) return existingApps[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    return initializeApp({ credential: cert(serviceAccount) });
  }

  return initializeApp({ credential: applicationDefault() });
}

async function verifyFirebaseUser(req: express.Request) {
  const header = req.headers.authorization;
  const authHeader = Array.isArray(header) ? header[0] : header;

  if (!authHeader?.startsWith('Bearer ')) {
    const error = new Error('Missing Firebase auth token.');
    (error as any).statusCode = 401;
    throw error;
  }

  getFirebaseAdminApp();
  return getAuth().verifyIdToken(authHeader.slice('Bearer '.length));
}

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error('Razorpay is not configured on the server.');
    (error as any).statusCode = 503;
    throw error;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('Gemini API key is not configured on the server.');
    (error as any).statusCode = 503;
    throw error;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
}

function sendApiError(res: express.Response, error: any) {
  console.error(error);
  res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());

  // --- API Routes ---

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Teacher Endpoint
  app.post('/api/ai/teacher', async (req, res) => {
    try {
      const genAI = getGeminiClient();
      const { prompt, history, studentContext } = req.body;
      
      const systemInstruction = `You are GyanMitra, a friendly and motivational AI teacher for Indian students. 
      Student context: ${studentContext.classLevel}, Medium: ${studentContext.medium}. 
      Explain concepts step-by-step using simple language. Use analogies relevant to Indian students.
      Support English, Hindi, and Odia as requested. If the student asks in Hindi, respond in Hindi.
      Follow NCERT curriculum guidelines where applicable.`;

      // Format history for Gemini SDK
      const contents = history ? history.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })) : [];

      // Append current prompt
      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const result = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-thinking-exp-01-21',
        contents,
        config: { systemInstruction }
      });
      
      res.json({ response: result.text });
    } catch (error: any) {
      console.error('AI Teacher Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Quiz Generator
  app.post('/api/ai/quiz', async (req, res) => {
    try {
      const genAI = getGeminiClient();
      const { topic, classLevel, difficulty = 'medium', format = 'mcq', sourceMaterial } = req.body;
      
      let formatGuide = '';
      if (format === 'mcq') {
        formatGuide = 'multiple choice questions with 4 options';
      } else if (format === 'tf' || format === 'true_false') {
        formatGuide = 'True/False questions with two options: "True" and "False"';
      } else if (format === 'short' || format === 'short_answer') {
        formatGuide = 'short answer questions where students must provide a brief text response';
      } else {
        formatGuide = 'a mix of multiple choice, True/False, and short answer questions';
      }

      const prompt = `Generate a 5-question quiz on the topic "${topic}" for a ${classLevel} student.
      Difficulty: ${difficulty}.
      Format: ${formatGuide}.
      ${sourceMaterial ? `Base the questions on this content: ${sourceMaterial}` : ''}
      
      Return the response strictly in JSON format as an array of objects with the following schema:
      [{ 
        "id": "string (unique)", 
        "type": "mcq" | "tf" | "short", 
        "question": "string", 
        "options": ["string", "string"] (For mcq: 4 options. For tf: ["True", "False"]. For short: []), 
        "correctAnswer": "string", 
        "explanation": "string",
        "difficulty": "${difficulty}"
      }]`;

      const result = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-thinking-exp-01-21',
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });

      res.json({ quiz: JSON.parse(result.text || '[]') });
    } catch (error: any) {
      console.error('Quiz Generator Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Study Plan Generator
  app.post('/api/ai/study-plan', async (req, res) => {
    try {
      const genAI = getGeminiClient();
      const { studentProfile, performanceData, examDate } = req.body;

      const prompt = `Act as an expert academic counselor. Create a personalized weekly study plan for a student.
      Student Info: Class: ${studentProfile.classLevel}, Current Level: ${studentProfile.level}.
      Identified Weak Topics: ${studentProfile.weakTopics?.join(', ') || 'None specifically identified yet'}.
      Performance Data: ${JSON.stringify(performanceData)}.
      Target Exam Date: ${examDate || 'Next month'}.
      
      Return a structured JSON plan with:
      {
        "objective": "string (a clear learning objective for the week)",
        "weeklySchedule": [
          { "day": "Monday", "tasks": [{ "subject": "string", "topic": "string", "action": "read" | "quiz" | "practice", "duration": "string" }] }
        ],
        "focusAreas": ["string (3-5 specific topics to master this week)"],
        "motivation": "A 1-2 sentence highly personalized motivational message tailored to this specific student's profile (${studentProfile.classLevel}, Level ${studentProfile.level}). The message MUST specifically address their weak areas or highlight their strengths based on their performance data to provide genuine encouragement."
      }`;

      const result = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-thinking-exp-01-21',
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });

      res.json({ plan: JSON.parse(result.text || '{}') });
    } catch (error: any) {
      console.error('Study Plan Generator Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Summary Generator
  app.post('/api/ai/summary', async (req, res) => {
    try {
      const genAI = getGeminiClient();
      const { content, classLevel } = req.body;
      
      const prompt = `Summarize the following educational content for a ${classLevel} student in simple language. 
      Highlight the key formulas and concepts. 
      Content: ${content}`;

      const result = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-thinking-exp-01-21',
        contents: [{ parts: [{ text: prompt }] }]
      });

      res.json({ summary: result.text });
    } catch (error: any) {
      console.error('Summary Generator Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Flashcard Generator
  app.post('/api/ai/flashcards', async (req, res) => {
    try {
      const genAI = getGeminiClient();
      const { topic, content, classLevel } = req.body;

      const prompt = `Generate 10 flashcards for the topic "${topic}" suitable for a ${classLevel} student.
      ${content ? `Use this content as reference: ${content}` : 'Use standard NCERT curriculum knowledge.'}
      
      Each flashcard should have a "front" (question or term) and a "back" (answer or definition).
      Return strictly as a JSON array: [{ "id": "string", "front": "string", "back": "string" }]`;

      const result = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-thinking-exp-01-21',
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });

      res.json({ cards: JSON.parse(result.text || '[]') });
    } catch (error: any) {
      console.error('Flashcard Generator Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Payment: Create Order
  app.post('/api/payments/order', async (req, res) => {
    try {
      const decodedToken = await verifyFirebaseUser(req);
      const razorpay = getRazorpayClient();
      const amountInRupees = Number(process.env.PREMIUM_PRICE_INR || '19');
      const receipt = `premium_${decodedToken.uid.slice(0, 18)}_${Date.now()}`.slice(0, 40);
      const options = {
        amount: amountInRupees * 100,
        currency: 'INR',
        receipt,
        notes: {
          userId: decodedToken.uid,
          plan: req.body?.plan || 'premium_monthly'
        }
      };
      const order = await razorpay.orders.create(options);
      res.json({ order, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error: any) {
      sendApiError(res, error);
    }
  });

  // Payment: Verify Razorpay signature and activate the subscription.
  app.post('/api/payments/verify', async (req, res) => {
    try {
      const decodedToken = await verifyFirebaseUser(req);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        const error = new Error('Missing Razorpay verification fields.');
        (error as any).statusCode = 400;
        throw error;
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        const error = new Error('Razorpay is not configured on the server.');
        (error as any).statusCode = 503;
        throw error;
      }

      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        const error = new Error('Invalid Razorpay payment signature.');
        (error as any).statusCode = 400;
        throw error;
      }

      getFirebaseAdminApp();
      const db = getFirestore();
      const subscriptionEndsAt = new Date();
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);

      await db.doc(`users/${decodedToken.uid}`).set({
        isPremium: true,
        subscriptionPlan: 'active',
        subscriptionEndsAt,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      await db.collection('payments').add({
        userId: decodedToken.uid,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: Number(process.env.PREMIUM_PRICE_INR || '19'),
        currency: 'INR',
        status: 'paid',
        planType: 'premium_monthly',
        createdAt: FieldValue.serverTimestamp()
      });

      res.json({ success: true, subscriptionEndsAt: subscriptionEndsAt.toISOString() });
    } catch (error: any) {
      sendApiError(res, error);
    }
  });

  // --- Vite / Static Assets ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist', 'client');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
