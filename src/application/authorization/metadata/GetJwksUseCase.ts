import { UUIDToShort } from "~/lib/ShortUUID"
import { SigningKeyRepository } from "~/domain/repositories"

export class GetJwksUseCase {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async execute(): Promise<object> {
    // Workaround because Jest does not support ES modules.
    const jose = require("jose")

    const validationKeys = await this.signingKeyRepository.query()

    return await Promise.all(
      validationKeys.map(async key => {
        const cryptoKey = await jose.importSPKI(key.publicKey, "RS256")
        const jwk = await jose.exportJWK(cryptoKey)
        jwk.kid = UUIDToShort(key.id)
        jwk.alg = "RS256"
        jwk.use = "sig"
        return jwk
      })
    )
  }
}
