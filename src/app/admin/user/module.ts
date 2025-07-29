import { asClass, AwilixContainer } from "awilix"
import { UserController } from "./api/UserController"
import { CreateUserUseCase } from "./use-cases/CreateUserUseCase"
import { DeleteUserUseCase } from "./use-cases/DeleteUserUseCase"
import { GetAllUsersUseCase } from "./use-cases/GetAllUsersUseCase"
import { GetUserByIdUseCase } from "./use-cases/GetUserByIdUseCase"
import { UpdateUserUseCase } from "./use-cases/UpdateUserUseCase"

export default function registerUserAdminModule(container: AwilixContainer) {
  container.register({
    userController: asClass(UserController).singleton(),

    createUserUseCase: asClass(CreateUserUseCase).singleton(),
    deleteUserUseCase: asClass(DeleteUserUseCase).singleton(),
    getAllUsersUseCase: asClass(GetAllUsersUseCase).singleton(),
    getUserByIdUseCase: asClass(GetUserByIdUseCase).singleton(),
    updateUserUseCase: asClass(UpdateUserUseCase).singleton(),
  })
}
