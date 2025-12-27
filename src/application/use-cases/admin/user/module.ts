import { AwilixContainer, asClass } from 'awilix';
import { CreateUserHandler } from './CreateUserHandler';
import { DeleteUserHandler } from './DeleteUserHandler';
import { GetUserByIdHandler } from './GetUserByIdHandler';
import { SearchUsersHandler } from './SearchUsersHandler';
import { UpdateUserHandler } from './UpdateUserHandler';

export default async function registerUserAdminUseCases(container: AwilixContainer) {
  container.register({
    createUserHandler: asClass(CreateUserHandler).singleton(),
    deleteUserHandler: asClass(DeleteUserHandler).singleton(),
    updateUserHandler: asClass(UpdateUserHandler).singleton(),

    getUserByIdHandler: asClass(GetUserByIdHandler).singleton(),
    searchUsersHandler: asClass(SearchUsersHandler).singleton(),
  });
}
