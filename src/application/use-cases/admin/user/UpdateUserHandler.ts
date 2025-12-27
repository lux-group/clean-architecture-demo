import { EventPublisher } from '~/application/ports';
import { UpdateUserProps, User } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { UserRepository } from '~/domain/repositories';

export type UpdateUserCommand = UpdateUserProps & {
  id: string;
};

export class UpdateUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const { id, ...props } = command;
    const user = await this.userRepository.getById(id);
    const updatedUser = User.update(user, props);
    await this.userRepository.update(updatedUser);

    const event = EntityChangeEvent.entityUpdated('User', updatedUser);
    this.eventPublisher.publishEvent(event);

    return updatedUser;
  }
}
