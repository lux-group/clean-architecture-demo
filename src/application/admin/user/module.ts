import { asClass, AwilixContainer } from "awilix"

import {
  CreateUserUseCase,
  DeleteUserUseCase,
  GetAllUsersUseCase,
  GetUserByIdUseCase,
  UpdateUserUseCase
} from "."

export default function registerUserModule(container: AwilixContainer) {
  container.register({
    createUserUseCase: asClass(CreateUserUseCase).singleton(),
    deleteUserUseCase: asClass(DeleteUserUseCase).singleton(),
    getAllUsersUseCase: asClass(GetAllUsersUseCase).singleton(),
    getUserByIdUseCase: asClass(GetUserByIdUseCase).singleton(),
    updateUserUseCase: asClass(UpdateUserUseCase).singleton(),
  })
}
