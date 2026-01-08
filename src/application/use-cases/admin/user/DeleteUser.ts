import { EventPublisher } from '~/application/ports';
import { EntityChangeEvent } from '~/domain/events';
import { UserRepository } from '~/domain/repositories';

export interface DeleteUserCommand {
  id: string;
}

export type DeleteUser = ReturnType<typeof deleteUser>;

export const deleteUser = (userRepository: UserRepository, eventPublisher: EventPublisher) => {
  return async (command: DeleteUserCommand): Promise<void> => {
    const user = await userRepository.getById(command.id);
    await userRepository.delete(user);

    const event = EntityChangeEvent.entityDeleted('User', command.id);
    eventPublisher.publishEvent(event);
  };
};
