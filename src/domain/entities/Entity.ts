import { ZodError, ZodObject } from "zod"
import { ValidationError } from "../errors"

export type EntityProps = Readonly<{
  id: string
  createdAt: Date
  updatedAt: Date
}>

export function validateProps(schema: ZodObject, props: object) {
  try {
    schema.parse(props)
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map(issue => ({
        path: issue.path.join("."),
        message: issue.message,
      }))

      throw new ValidationError(error.message, errors)
    }

    throw error
  }
}

export abstract class Entity<Props extends EntityProps> {
  private _props: Props
  private _originalUpdatedAt: Date

  constructor(props: Props) {
    this._props = props
    this._originalUpdatedAt = props.updatedAt
  }

  get id() {
    return this.props.id
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }
  get originalUpdatedAt() {
    return this._originalUpdatedAt
  }
  get props(): Props {
    return this._props
  }

  protected set props(value: Props) {
    this._props = value
  }

  commit() {
    this._originalUpdatedAt = this._props.updatedAt
  }
}
