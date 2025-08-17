import { importSPKI, exportJWK } from "jose"
import { Query } from "~/lib/types"
import { UUIDToShort } from "~/lib/ShortUUID"
import { SigningKey } from "~/domain/entities"
import { SigningKeyRepository } from "~/domain/repositories"

export class GetJsonWebKeysHandler {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async execute(): Promise<object> {
    const query: Query<SigningKey> = {
      offset: 0,
      limit: 10,
      orderBy: { property: "createdAt", direction: "desc" },
    }
    
    const { items: validationKeys } = await this.signingKeyRepository.query(query)

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
