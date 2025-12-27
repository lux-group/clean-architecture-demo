import { Prisma, SigningKey as PrismaSigningKey } from '@prisma/client';
import { EncryptionProvider } from '~/application/ports';
import { SigningKey } from '~/domain/entities';
import { NotFoundError } from '~/domain/errors';
import { SigningKeyRepository } from '~/domain/repositories';
import { Query, QueryResult } from '~/lib/types';
import { mapQuery } from './helpers';
import { PrismaClient } from './PrismaClient';

export class PrismaSigningKeyRepository implements SigningKeyRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly encryptionProvider: EncryptionProvider,
  ) {}

  async query(options: Query<SigningKey>): Promise<QueryResult<SigningKey>> {
    const query = mapQuery(options) as Prisma.SigningKeyFindManyArgs;
    const [total, signingKeys] = await this.prismaClient
      .$replica()
      .$transaction([
        this.prismaClient.$replica().signingKey.count({ where: query.where }),
        this.prismaClient.$replica().signingKey.findMany(query),
      ]);

    return {
      items: signingKeys.map(sk => this.mapFromPrismaSigningKey(sk)),
      total,
    };
  }

  async getById(id: string): Promise<SigningKey> {
    const signingKey = await this.tryGetById(id);
    if (!signingKey) {
      throw new NotFoundError(`Signing key with id ${id} not found.`);
    }

    return signingKey;
  }

  async tryGetById(id: string): Promise<SigningKey | undefined> {
    const signingKey = await this.prismaClient.$primary().signingKey.findUnique({
      where: { id },
    });
    return signingKey ? this.mapFromPrismaSigningKey(signingKey) : undefined;
  }

  async tryGetActiveSigningKey(): Promise<SigningKey | undefined> {
    const signingKey = await this.prismaClient.$primary().signingKey.findFirst({
      where: {
        privateKey: {
          not: null,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return signingKey ? this.mapFromPrismaSigningKey(signingKey) : undefined;
  }

  async insert(signingKey: SigningKey): Promise<void> {
    await this.prismaClient.$primary().signingKey.create({
      data: this.mapToPrismaSigningKey(signingKey),
    });
  }

  async update(signingKey: SigningKey): Promise<void> {
    await this.prismaClient.$primary().signingKey.update({
      where: { id: signingKey.id },
      data: this.mapToPrismaSigningKey(signingKey),
    });
  }

  async delete(signingKey: SigningKey): Promise<void> {
    await this.prismaClient.$primary().signingKey.delete({
      where: { id: signingKey.id },
    });
  }

  private mapFromPrismaSigningKey(prismaSigningKey: PrismaSigningKey): SigningKey {
    return {
      ...prismaSigningKey,
      privateKey: prismaSigningKey.privateKey ? this.encryptionProvider.decrypt(prismaSigningKey.privateKey) : null,
    };
  }

  private mapToPrismaSigningKey(signingKey: SigningKey): PrismaSigningKey {
    return {
      ...signingKey,
      privateKey: signingKey.privateKey ? this.encryptionProvider.encrypt(signingKey.privateKey) : null,
    } as PrismaSigningKey;
  }
}
