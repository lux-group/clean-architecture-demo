import { SigningKey } from "../entities"

export interface SigningKeyRepository {
  query(): Promise<SigningKey[]>
  getById(id: string): Promise<SigningKey>
  tryGetById(id: string): Promise<SigningKey | undefined>
  getActiveSigningKey(): Promise<SigningKey>
  tryGetActiveSigningKey(): Promise<SigningKey | undefined>
  tryGetValidationKeyById(id: string): Promise<SigningKey | undefined>
  insert(signingKey: SigningKey): Promise<void>
  update(signingKey: SigningKey): Promise<void>
  delete(id: string): Promise<void>
}
