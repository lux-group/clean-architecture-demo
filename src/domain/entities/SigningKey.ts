import { randomUUID } from "node:crypto"
import z from "zod"
import { InvalidOperationError } from "../errors"
import { Entity, validateProps } from "./Entity"

const signingKeySchema = z.object({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  publicKey: z.string().min(1).max(10000),
  privateKey: z.string().min(1).max(10000).nullable(),
})

export type SigningKeyProps = Readonly<z.input<typeof signingKeySchema>>
export type CreateSigningKeyProps = Omit<SigningKeyProps, "id" | "createdAt" | "updatedAt">

export class SigningKey extends Entity<SigningKeyProps> {
  constructor(props: SigningKeyProps) {
    super(props)
  }

  get publicKey() { return this.props.publicKey }
  get privateKey() { return this.props.privateKey }

  static createNew(props: CreateSigningKeyProps) {
    const now = new Date()
    const allProps: SigningKeyProps = {
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    validateProps(signingKeySchema, allProps)
    return new SigningKey(allProps)
  }

  ensureCanDelete() {
    if (this.privateKey != null) {
      throw new InvalidOperationError("The signing key cannot be deleted while it is active.")
    }
  }

  deactivate() {
    if (this.privateKey == null) {
      throw new InvalidOperationError("The signing key cannot be deactivated because it is already inactive.")
    }

    this.props = {
      ...this.props,
      privateKey: null,
      updatedAt: new Date(),
    }
  }
}
