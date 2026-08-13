import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

/**
 * Hash an OTP or token before storing in the DB.
 * Uses fewer rounds than password hashing for speed (OTPs are short-lived).
 */
export async function hashToken(plain: string): Promise<string> {
  return bcrypt.hash(plain, 8);
}

export async function compareToken(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
