import { Prisma, SigningKey as PrismaSigningKey } from "@prisma/client"
import { EncryptionProvider } from "~/app/shared/adapters"
import { SigningKey } from "~/domain/entities"
import { NotFoundError } from "~/domain/errors"
import { SigningKeyRepository } from "~/domain/repositories"
import { Query, QueryResult } from "~/lib/types"
import { mapQuery } from "./helpers"
import { PrismaClient } from "./PrismaClient"

export class PrismaSigningKeyRepository implements SigningKeyRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly encryptionProvider: EncryptionProvider,
  ) {}

  async query(options: Query<SigningKey>): Promise<QueryResult<SigningKey>> {
    const query = mapQuery(options) as Prisma.SigningKeyFindManyArgs
    const [total, signingKeys] = await this.prismaClient
      .$replica()
      .$transaction([
        this.prismaClient.$replica().signingKey.count({ where: query.where }),
        this.prismaClient.$replica().signingKey.findMany(query),
      ])

    return {
      items: signingKeys.map(sk => this.mapToSigningKey(sk)),
      total,
    }
  }

  async getById(id: string): Promise<SigningKey> {
    const signingKey = await this.tryGetById(id)
    if (!signingKey) {
      throw new NotFoundError(`Signing key with id ${id} not found.`)
    }

    return signingKey
  }

  async tryGetById(id: string): Promise<SigningKey | undefined> {
    const signingKey = await this.prismaClient.$primary().signingKey.findUnique({
      where: { id },
    })
    return signingKey ? this.mapToSigningKey(signingKey) : undefined
  }

  async tryGetActiveSigningKey(): Promise<SigningKey | undefined> {
    const signingKey = await this.prismaClient.$primary().signingKey.findFirst({
      where: {
        privateKey: {
          not: null,
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return signingKey ? this.mapToSigningKey(signingKey) : undefined
  }

  async insert(signingKey: SigningKey): Promise<void> {
    await this.prismaClient.$primary().signingKey.create({
      data: this.mapToPrismaSigningKey(signingKey),
    })
  }

  async update(signingKey: SigningKey): Promise<void> {
    await this.prismaClient.$primary().signingKey.update({
      where: { id: signingKey.id, updatedAt: signingKey.originalUpdatedAt },
      data: this.mapToPrismaSigningKey(signingKey),
    })

    signingKey.commit()
  }

  async delete(signingKey: SigningKey): Promise<void> {
    await this.prismaClient.$primary().signingKey.delete({
      where: { id: signingKey.id, updatedAt: signingKey.originalUpdatedAt },
    })
  }

  private mapToSigningKey(sk: PrismaSigningKey): SigningKey {
    return new SigningKey({
      id: sk.id,
      createdAt: sk.createdAt,
      updatedAt: sk.updatedAt,
      publicKey: sk.publicKey,
      privateKey: sk.privateKey ? this.encryptionProvider.decrypt(sk.privateKey) : null,
    })
  }

  private mapToPrismaSigningKey(sk: SigningKey): PrismaSigningKey {
    return {
      id: sk.id,
      createdAt: sk.createdAt,
      updatedAt: sk.updatedAt,
      publicKey: sk.publicKey,
      privateKey: sk.privateKey ? this.encryptionProvider.encrypt(sk.privateKey) : null,
    } as PrismaSigningKey
  }
}
