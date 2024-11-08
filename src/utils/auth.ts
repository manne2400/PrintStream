import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'PrintStream-JWT-Secret'; // Bør flyttes til .env fil

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
}

// Hash password før det gemmes i databasen
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Verificer password ved login
export const verifyPassword = async (
  password: string, 
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generer JWT token ved login
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
};

// Verificer JWT token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, SECRET_KEY) as JWTPayload;
  } catch (err) {
    return null;
  }
}; 