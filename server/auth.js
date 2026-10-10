import crypto from 'crypto';
import { getUsersFromDb, insertUserToDb, deleteUserFromDb } from './db.js';

// In-memory active tokens
const activeSessions = new Map();

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
}

export function loadUsers() {
  return getUsersFromDb();
}

export function isSetupRequired() {
  const users = loadUsers();
  return users.length === 0;
}

export function createInitialAdmin(username, password) {
  const users = loadUsers();
  if (users.length > 0) {
    throw new Error('Initial setup already completed.');
  }

  if (!username || username.trim().length < 3) {
    throw new Error('Username must be at least 3 characters.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: 'admin-1',
    username: username.trim(),
    hash,
    salt,
    createdAt: Date.now()
  };

  insertUserToDb(newUser);

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, { id: newUser.id, username: newUser.username });

  return { token, user: { id: newUser.id, username: newUser.username } };
}

export function loginUser(username, password) {
  const users = loadUsers();
  const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

  if (!user) {
    throw new Error('Invalid username or password.');
  }

  const isValid = verifyPassword(password, user.hash, user.salt);
  if (!isValid) {
    throw new Error('Invalid username or password.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, { id: user.id, username: user.username });

  return { token, user: { id: user.id, username: user.username } };
}

export function verifySession(token) {
  if (!token) return null;
  return activeSessions.get(token) || null;
}

export function logoutUser(token) {
  if (token) {
    activeSessions.delete(token);
  }
}
