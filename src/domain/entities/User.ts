import { randomUUID } from "node:crypto"
import z from "zod"
import { commonErrors, InvalidOperationError } from "../errors"
import { Entity, validateProps } from "./Entity"

const userIdentitySchema = z.object({
  id: z.uuid(),
  identityProviderId: z.uuid(),
  identifierClaimValue: z.string().min(1).max(255),
})

const userSchema = z.object({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isEnabled: z.boolean(),
  brand: z.string().min(1).max(50),
  givenName: z.string().min(1).max(50),
  surname: z.string().min(1).max(50),
  email: z.email().max(255),
  emailVerified: z.boolean(),
  phone: z.string().min(4).max(15).nullable(),
  country: z.string().min(2).max(2).nullable(),
  city: z.string().min(4).max(50).nullable(),
  postcode: z.string().min(4).max(20).nullable(),
  passwordHash: z.string().min(4).max(255).nullable(),
  roles: z.array(z.string().min(1).max(50)),
  identities: z.array(userIdentitySchema),
})

export type UserIdentity = Readonly<z.input<typeof userIdentitySchema>>
export type UserProps = Readonly<z.input<typeof userSchema>>
export type CreateUserProps = Omit<UserProps, "id" | "createdAt" | "updatedAt" | "identities">
export type UpdateUserProps = Omit<UserProps, "id" | "createdAt" | "updatedAt" | "brand" | "email" | "emailVerified" | "phone" | "passwordHash" | "identities">

export class User extends Entity<UserProps> {
  constructor(props: UserProps) {
    super(props)
  }

  get isEnabled() { return this.props.isEnabled }
  get brand() { return this.props.brand }
  get givenName() { return this.props.givenName }
  get surname() { return this.props.surname }
  get email() { return this.props.email }
  get emailVerified() { return this.props.emailVerified }
  get phone() { return this.props.phone }
  get country() { return this.props.country }
  get city() { return this.props.city }
  get postcode() { return this.props.postcode }
  get passwordHash() { return this.props.passwordHash }
  get roles() { return this.props.roles }
  get identities() { return this.props.identities }

  get isServiceAccount() { return this.roles.includes("service") }
  get fullName() { return User.formatFullName(this.givenName, this.surname) }

  static formatFullName = (givenName: string, surname: string) => `${givenName} ${surname}`

  static createNew(props: CreateUserProps & { identities?: UserIdentity[] }) {
    const now = new Date()
    const allProps: UserProps = {
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      isEnabled: props.isEnabled ?? true,
      identities: props.identities ?? [],
    }

    validateProps(userSchema, allProps)
    return new User(allProps)
  }

  update(props: UpdateUserProps) {
    const allProps = {
      ...this.props,
      ...props,
      updatedAt: new Date(),
    }

    validateProps(userSchema, allProps)
    this.props = allProps
  }

  addIdentity(identityProviderId: string, identifierClaimValue: string) {
    if (this.identities.some(i => i.identityProviderId === identityProviderId)) {
      throw new InvalidOperationError(commonErrors.duplicateIdentity)
    }

    const newIdentity: UserIdentity = {
      id: randomUUID(),
      identityProviderId,
      identifierClaimValue
    }
    
    this.props = {
      ...this.props,
      passwordHash: null, // Clear password when adding identity
      identities: [...this.props.identities, newIdentity],
      updatedAt: new Date(),
    }

    return newIdentity
  }

  changePassword(passwordHash: string) {
    if (this.identities.length > 0) {
      throw new InvalidOperationError(commonErrors.passwordChangeNotAllowed)
    }

    this.props = {
      ...this.props,
      passwordHash,
      updatedAt: new Date(),
    }
  }

  canSignInWithActiveSession() {
    return this.isEnabled && !this.isServiceAccount
  }

  canSignInWithIdentityProvider() {
    return this.isEnabled && this.identities.length > 0
  }

  canSignInWithPassword() {
    return this.isEnabled && this.identities.length === 0 && !this.isServiceAccount
  }

  canSignInWithClientSecret() {
    return this.isEnabled && this.identities.length === 0 && this.isServiceAccount
  }

  canImpersonateUser(userToImpersonate: User) {
    return this.roles.includes("employee") &&
      userToImpersonate.roles.length === 0 &&
      userToImpersonate.id !== this.id
  }

  handleFailedSignInAttempt() {
    // Logic for handling failed sign-in attempts can be added here
  }
}
