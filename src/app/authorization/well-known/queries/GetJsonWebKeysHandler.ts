import { importSPKI, exportJWK } from "jose"
import { UUIDToShort } from "~/lib/ShortUUID"
import { SigningKeyRepository } from "~/domain/repositories"

export class GetJsonWebKeysHandler {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async execute(): Promise<object> {
    const validationKeys = await this.signingKeyRepository.query()

    const keys = await Promise.all(
      validationKeys.map(async key => {
        const cryptoKey = await importSPKI(key.publicKey, "RS256")
        const jwk = await exportJWK(cryptoKey)
        jwk.kid = UUIDToShort(key.id)
        jwk.alg = "RS256"
        jwk.use = "sig"
        return jwk
      })
    )

    return { keys }
  }
}
