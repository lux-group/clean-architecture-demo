import { AwilixContainer } from "awilix"
import { AuthClientFactory, SignInRequest, SignInResponse, SignOutRequest } from "~/domain/adapters"

export class TestMockContext {
  constructor(private readonly container: AwilixContainer) {}

  authClientCreateSignInRequest(action: (redirectUrl: string) => SignInRequest): void {
    const authClientFactory = this.container.resolve<AuthClientFactory>("authClientFactory")

    jest.spyOn(authClientFactory, "createClient").mockReturnValue({
      supportsSignOut: true,
      supportsEditProfile: false,
      createSignInRequest: jest.fn().mockImplementation(redirectUrl => Promise.resolve(action(redirectUrl))),
      createSignOutRequest: jest.fn(),
      processSignInResponse: jest.fn(),
      checkSessionWithRefreshToken: jest.fn(),
      editProfile: jest.fn(),
    })
  }

  authClientCreateSignOutRequest(action: (redirectUrl: string) => SignOutRequest): void {
    const authClientFactory = this.container.resolve<AuthClientFactory>("authClientFactory")

    jest.spyOn(authClientFactory, "createClient").mockReturnValue({
      supportsSignOut: true,
      supportsEditProfile: false,
      createSignInRequest: jest.fn(),
      createSignOutRequest: jest.fn().mockImplementation(redirectUrl => Promise.resolve(action(redirectUrl))),
      processSignInResponse: jest.fn(),
      checkSessionWithRefreshToken: jest.fn(),
      editProfile: jest.fn(),
    })
  }

  authClientProcessSignInResponse(action: () => SignInResponse): void {
    const authClientFactory = this.container.resolve<AuthClientFactory>("authClientFactory")

    jest.spyOn(authClientFactory, "createClient").mockReturnValue({
      supportsSignOut: true,
      supportsEditProfile: false,
      createSignInRequest: jest.fn(),
      createSignOutRequest: jest.fn(),
      processSignInResponse: jest.fn().mockImplementation(() => Promise.resolve(action())),
      checkSessionWithRefreshToken: jest.fn(),
      editProfile: jest.fn(),
    })
  }
}