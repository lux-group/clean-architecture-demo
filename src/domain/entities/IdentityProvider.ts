import { randomUUID } from "node:crypto"
import z from "zod"
import { commonErrors, InvalidOperationError } from "../errors"
import { Entity, validateProps } from "./Entity"

export const IdentityProviderType = {
  Entra: "ENTRA",
  Google: "GOOGLE",
  Apple: "APPLE",
  Facebook: "FACEBOOK",
} as const

export type IdentityProviderType = typeof IdentityProviderType[keyof typeof IdentityProviderType]

const identityProviderAuthSettingsSchema = z.object({
  type: z.enum(IdentityProviderType),
  brand: z.string().min(5).max(50),
  clientId: z.string().min(10).max(100),
  clientSecret: z.string().min(10).max(100),
  redirectUrls: z.array(z.url()).min(1).max(20),
  autoLinkUsers: z.boolean().default(false),
  autoCreateUsers: z.boolean().default(false),
})

const identityProviderSchema = z.object({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string().min(5).max(50),
  issuerUrl: z.url(),
  audience: z.string().min(10).max(100),
  identifierClaimName: z.string().min(3).max(20),
  authSettings: identityProviderAuthSettingsSchema.nullable(),
})

export type IdentityProviderAuthSettings = Readonly<z.input<typeof identityProviderAuthSettingsSchema>>
export type IdentityProviderProps = Readonly<z.input<typeof identityProviderSchema>>
export type CreateIdentityProviderProps = Omit<IdentityProviderProps, "id" | "createdAt" | "updatedAt">
export type UpdateIdentityProviderProps = Omit<IdentityProviderProps, "id" | "createdAt" | "updatedAt">

export class IdentityProvider extends Entity<IdentityProviderProps> {
  constructor(props: IdentityProviderProps) {
    super(props)
  }

  get name() { return this.props.name }
  get issuerUrl() { return this.props.issuerUrl }
  get audience() { return this.props.audience }
  get identifierClaimName() { return this.props.identifierClaimName }
  get authSettings() { return this.props.authSettings }

  static createNew(props: CreateIdentityProviderProps) {
    const now = new Date()
    const allProps: IdentityProviderProps = {
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    validateProps(identityProviderSchema, allProps)
    return new IdentityProvider(allProps)
  }

  update(props: UpdateIdentityProviderProps) {
    const allProps: IdentityProviderProps = {
      ...this.props,
      ...props,
      updatedAt: new Date(),
    }

    validateProps(identityProviderSchema, allProps)
    this.props = allProps
  }

  verifyRedirectUrl(redirectUrl: string) {
    if (!this.authSettings) {
      throw new InvalidOperationError(commonErrors.missingAuthSettings)
    }

    if (!this.authSettings.redirectUrls.some(url => redirectUrl.startsWith(url))) {
      throw new InvalidOperationError(commonErrors.invalidRedirectUrl)
    }
  }
}
