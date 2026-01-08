import { EventPublisher } from '~/application/ports';
import { UpdateUserProps, User } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { UserRepository } from '~/domain/repositories';

export type UpdateUserCommand = UpdateUserProps & {
  id: string;
};

export type UpdateUser = ReturnType<typeof updateUser>;

export const updateUser = (userRepository: UserRepository, eventPublisher: EventPublisher) => {
  return async (command: UpdateUserCommand): Promise<User> => {
    const { id, ...props } = command;
    const user = await userRepository.getById(id);
    const updatedUser = User.update(user, props);
    await userRepository.update(updatedUser);

    const event = EntityChangeEvent.entityUpdated('User', updatedUser);
    eventPublisher.publishEvent(event);

    return updatedUser;
  };
};
