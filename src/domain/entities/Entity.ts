import { ZodError, ZodObject } from "zod"
import { ValidationError } from "../errors"

type EntityProps = Readonly<{
  id: string
  createdAt: Date
  updatedAt: Date
}>

export function validateProps(schema: ZodObject, props: object) {
  try {
    schema.parse(props)
  } catch(error){
    if(error instanceof ZodError){
      const errors = error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
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

  // Timestamp for optimistic concurrency control
  get originalUpdatedAt() { return this._originalUpdatedAt }

  get props(): Props { return this._props }

  commit() {
    this._originalUpdatedAt = this._props.updatedAt
  }

  protected set props(value: Props) {
    this._props = value
  }
}
