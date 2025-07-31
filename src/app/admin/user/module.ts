import { asClass, AwilixContainer } from "awilix"
import { UserController } from "./api/UserController"
import { CreateUserHandler } from "./commands/CreateUserHandler"
import { DeleteUserHandler } from "./commands/DeleteUserHandler"
import { UpdateUserHandler } from "./commands/UpdateUserHandler"
import { GetUserByIdHandler } from "./queries/GetUserByIdHandler"
import { SearchUsersHandler } from "./queries/SearchUsersHandler"

export default function registerUserAdminModule(container: AwilixContainer) {
  container.register({
    userController: asClass(UserController).singleton(),

    createUserHandler: asClass(CreateUserHandler).singleton(),
    deleteUserHandler: asClass(DeleteUserHandler).singleton(),
    updateUserHandler: asClass(UpdateUserHandler).singleton(),

    getUserByIdHandler: asClass(GetUserByIdHandler).singleton(),
    searchUsersHandler: asClass(SearchUsersHandler).singleton(),
  })
}
