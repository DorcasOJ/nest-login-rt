import * as bcrypt from 'bcrypt';

export function hash(rawPassword: string) {
  const SALT = bcrypt.genSaltSync();
  return bcrypt.hashSync(rawPassword, SALT);
}

export function compareHash(rawPassword: string, hash: string) {
  return bcrypt.compareSync(rawPassword, hash);
}
