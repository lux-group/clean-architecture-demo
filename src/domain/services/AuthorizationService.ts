import { User } from '../entities';
import { AuthorizationError } from '../errors';

export class AuthorizationService {
  authorizeImpersonation(user: User, userToImpersonate: User) {
    if (userToImpersonate.id === user.id) {
      throw AuthorizationError.impersonationNotAllowed(
        user.id,
        userToImpersonate.id,
        'A user cannot impersonate itself.',
      );
    }

    if (!user.roles.includes('employee')) {
      throw AuthorizationError.impersonationNotAllowed(
        user.id,
        userToImpersonate.id,
        'Only users with the employee role can impersonate other users.',
      );
    }

    if (User.isServiceAccount(user)) {
      throw AuthorizationError.impersonationNotAllowed(
        user.id,
        userToImpersonate.id,
        'Service accounts cannot impersonate users.',
      );
    }

    if (User.isServiceAccount(userToImpersonate)) {
      throw AuthorizationError.impersonationNotAllowed(
        user.id,
        userToImpersonate.id,
        'Users cannot impersonate service accounts.',
      );
    }

    if (userToImpersonate.roles.length > 0) {
      throw AuthorizationError.impersonationNotAllowed(
        user.id,
        userToImpersonate.id,
        'Only users without roles can be impersonated.',
      );
    }
  }
}
