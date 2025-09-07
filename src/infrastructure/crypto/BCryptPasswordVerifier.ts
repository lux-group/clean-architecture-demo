import bcrypt from "bcryptjs"
import { PasswordVerifier } from "~/app/adapters"

export class BCryptPasswordVerifier implements PasswordVerifier {
  verifyPassword(plainTextPassword: string, storedPasswordHash: string): boolean {
    return bcrypt.compareSync(plainTextPassword, storedPasswordHash)
  }

  createPasswordHash(plainTextPassword: string): string {
    return bcrypt.hashSync(plainTextPassword, 10)
  }
}
