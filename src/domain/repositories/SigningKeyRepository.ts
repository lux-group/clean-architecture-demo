import { SigningKey } from "../entities"
import { Repository } from "./Repository"

export interface SigningKeyRepository extends Repository<SigningKey> {
  tryGetActiveSigningKey(): Promise<SigningKey | undefined>
}
