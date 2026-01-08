import { EventPublisher, PasswordVerifier } from '~/application/ports';
import { CreateUserProps, User } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { UserRepository } from '~/domain/repositories';

export type CreateUserCommand = Omit<CreateUserProps, 'emailVerified' | 'passwordHash'> & {
  password: string;
};

export type CreateUser = ReturnType<typeof createUser>;

export const createUser = (
  userRepository: UserRepository,
  passwordVerifier: PasswordVerifier,
  eventPublisher: EventPublisher,
) => {
  return async (command: CreateUserCommand): Promise<User> => {
    const { password: _, ...inputWithoutPassword } = command;

    const props: CreateUserProps = {
      ...inputWithoutPassword,
      emailVerified: false,
      passwordHash: passwordVerifier.createPasswordHash(command.password),
    };

    const user = User.createNew(props);
    await userRepository.insert(user);

    const event = EntityChangeEvent.entityCreated('User', user);
    eventPublisher.publishEvent(event);

    return user;
  };
};
