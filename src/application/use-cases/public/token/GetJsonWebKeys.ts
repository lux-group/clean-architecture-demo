import { exportJWK, importSPKI } from 'jose';
import { SigningKey } from '~/domain/entities';
import { SigningKeyRepository } from '~/domain/repositories';
import { UUIDToShort } from '~/lib/ShortUUID';
import { Query } from '~/lib/types';

export type GetJsonWebKeys = ReturnType<typeof getJsonWebKeys>;

export const getJsonWebKeys = (signingKeyRepository: SigningKeyRepository) => {
  return async (): Promise<object> => {
    const query: Query<SigningKey> = {
      offset: 0,
      limit: 10,
      orderBy: { property: 'createdAt', direction: 'desc' },
    };

    const { items: validationKeys } = await signingKeyRepository.query(query);

    const keys = await Promise.all(
      validationKeys.map(async key => {
        const cryptoKey = await importSPKI(key.publicKey, 'RS256');
        const jwk = await exportJWK(cryptoKey);
        jwk.kid = UUIDToShort(key.id);
        jwk.alg = 'RS256';
        jwk.use = 'sig';
        return jwk;
      }),
    );

    return { keys };
  };
};
