import { randomUUID } from 'node:crypto';
import { InvalidOperationError } from '../errors';

export type UserIdentity = Readonly<{
  id: string;
  identityProviderId: string;
  identifierClaimValue: string;
}>;

export type User = Readonly<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isEnabled: boolean;
  brand: string;
  givenName: string;
  surname: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  country: string | null;
  city: string | null;
  postcode: string | null;
  passwordHash: string | null;
  roles: string[];
  identities: UserIdentity[];
}>;

export type CreateUserProps = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'identities'>;
export type UpdateUserProps = Omit<
  User,
  'id' | 'createdAt' | 'updatedAt' | 'brand' | 'email' | 'emailVerified' | 'phone' | 'passwordHash' | 'identities'
>;

export const User = {
  formatFullName: (givenName: string, surname: string) => `${givenName} ${surname}`,

  fullName(user: User): string {
    return User.formatFullName(user.givenName, user.surname);
  },

  isServiceAccount(user: User): boolean {
    return user.roles.includes('service');
  },

  createNew(props: CreateUserProps & { identities?: UserIdentity[] }, now: Date = new Date()): User {
    return {
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      isEnabled: props.isEnabled ?? true,
      identities: props.identities ?? [],
    };
  },

  update(user: User, props: UpdateUserProps, now: Date = new Date()): User {
    return {
      ...user,
      ...props,
      updatedAt: now,
    };
  },

  addIdentity(user: User, identityProviderId: string, identifierClaimValue: string, now: Date = new Date()): User {
    if (user.identities.some(i => i.identityProviderId === identityProviderId)) {
      throw InvalidOperationError.duplicateIdentity(user.id, identityProviderId);
    }

    const newIdentity: UserIdentity = {
      id: randomUUID(),
      identityProviderId,
      identifierClaimValue,
    };

    return {
      ...user,
      passwordHash: null, // Clear password when adding identity
      identities: [...user.identities, newIdentity],
      updatedAt: now,
    };
  },

  changePassword(user: User, passwordHash: string, now: Date = new Date()): User {
    if (user.identities.length > 0) {
      throw InvalidOperationError.passwordChangeNotAllowed(user.id, 'Account has external identities.');
    }

    return {
      ...user,
      passwordHash,
      updatedAt: now,
    };
  },

  handleFailedSignInAttempt(_user: User): void {
    // Logic for handling failed sign-in attempts can be added here
  },
} as const;
