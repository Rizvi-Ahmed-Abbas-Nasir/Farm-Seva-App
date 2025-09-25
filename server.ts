import express, { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'bson';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017';
const client = new MongoClient(mongoUrl);
let db: any;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('expo-app-db');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

connectDB();

interface User {
  email: string;
  password: string;
  fullName: string;
  score?: number;
}

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

const authenticateAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'expo-secret') as any;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/signup', async (req: any, res: any) => {
  try {
    const { email, password, fullName } = req.body as User;
    
    const users = db.collection('users');
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = { email, password: hashedPassword, fullName, score: 0 };
    
    const result = await users.insertOne(newUser);
    res.status(201).json({ 
      message: 'User created', 
      userId: result.insertedId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    
    const users = db.collection('users');
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'expo-secret', 
      { expiresIn: '1h' }
    );

    res.json({ token, userId: user._id, fullName: user.fullName });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/students', async (req: any, res: any) => {
  try {
    const students = await db.collection('users')
      .find()
      .sort({ score: -1 })
      .toArray();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.put('/api/students/:id/score', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { score } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const objectId = new ObjectId(id);

    console.log(`Querying for _id: ${objectId}`);

    const student = await db.collection('users').findOne({ _id: objectId });
    if (!student) {
      console.log(`No student found with _id: ${objectId}`);
      return res.status(404).json({ 
        error: 'Student not found',
        attemptedId: id,
        objectId: objectId.toString()
      });
    }

    const result = await db.collection('users').updateOne(
      { _id: { $eq: objectId } }, 
      { $set: { score: Number(score) } }
    );

    console.log(`Update result: ${JSON.stringify(result)}`);

    if (result.modifiedCount === 0) {
      return res.status(200).json({ 
        warning: 'No changes made',
        reason: 'Score may be same as current value',
        currentScore: student.score,
        attemptedScore: score
      });
    }

    res.json({
      success: true,
      updatedId: id,
      previousScore: student.score,
      newScore: score
    });

  } catch (error:any) {
    console.error('Update error:', error);
    res.status(500).json({ 
      error: 'Database operation failed',
      details: error.message 
    });
  }
});

app.delete('/api/students/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const result = await db.collection('users').deleteOne(
      { _id: new ObjectId(id) }
    );

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/admin/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    
    const admin = await db.collection('admin').findOne({ email });
    
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' }, 
      process.env.JWT_SECRET || 'expo-secret',
      { expiresIn: '8h' }
    );

    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});