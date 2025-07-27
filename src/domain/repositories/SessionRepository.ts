import { Session } from "../entities"

export interface SessionRepository {
  query(): Promise<Session[]>
  getById(id: string): Promise<Session>
  tryGetById(id: string): Promise<Session | undefined>
  tryGetByIdentityProviderSessionId(identityProviderSessionId: string): Promise<Session | undefined>
  insert(session: Session): Promise<void>
  update(session: Session): Promise<void>
}
