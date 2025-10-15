import bcrypt from "bcryptjs"
import { PasswordVerifier } from "~/app/ports"

export class BCryptPasswordVerifier implements PasswordVerifier {
  private static readonly COST_FACTOR = 13

  verifyPassword(plainTextPassword: string, storedPasswordHash: string): boolean {
    return bcrypt.compareSync(plainTextPassword, storedPasswordHash)
  }

  createPasswordHash(plainTextPassword: string): string {
    return bcrypt.hashSync(plainTextPassword, BCryptPasswordVerifier.COST_FACTOR)
  }
}
