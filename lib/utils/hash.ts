import crypto from 'crypto';

export const sha1 = (text: string): string => {
  return crypto.createHash('sha1').update(text).digest('hex');
};