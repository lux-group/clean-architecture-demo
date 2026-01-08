import { AwilixContainer, asFunction } from 'awilix';
import { createUser } from './CreateUser';
import { deleteUser } from './DeleteUser';
import { getUserById } from './GetUserById';
import { searchUsers } from './SearchUsers';
import { updateUser } from './UpdateUser';

export default async function registerUserAdminUseCases(container: AwilixContainer) {
  container.register({
    createUser: asFunction(createUser).singleton(),
    deleteUser: asFunction(deleteUser).singleton(),
    getUserById: asFunction(getUserById).singleton(),
    searchUsers: asFunction(searchUsers).singleton(),
    updateUser: asFunction(updateUser).singleton(),
  });
}
