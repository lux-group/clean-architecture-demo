import { SigningKey as PrismaSigningKey } from "@prisma/client"
import { PrismaClient } from "./PrismaClient"
import { EncryptionProvider } from "~/infrastructure/crypto"
import { NotFoundError } from "~/domain/errors"
import { SigningKey } from "~/domain/entities"
import { SigningKeyRepository } from "~/domain/repositories"

export class PrismaSigningKeyRepository implements SigningKeyRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly encryptionProvider: EncryptionProvider
  ) { }

  async query(offset?: number, limit?: number): Promise<SigningKey[]> {
    const signingKeys = await this.prismaClient.signingKey.findMany({
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit
    })

    return signingKeys.map(sk => this.mapToSigningKey(sk))
  }

  async getById(id: string): Promise<SigningKey> {
    const signingKey = await this.tryGetById(id)
    if (!signingKey) {
      throw new NotFoundError(`Signing key with id ${id} not found.`)
    }

    return signingKey
  }

  async tryGetById(id: string): Promise<SigningKey | undefined> {
    const signingKey = await this.prismaClient.signingKey.findUnique({
      where: { id }
    })
    return signingKey ? this.mapToSigningKey(signingKey) : undefined
  }

  async tryGetActiveSigningKey(): Promise<SigningKey | undefined> {
    const signingKey = await this.prismaClient.signingKey.findFirst({
      where: {
        privateKey: {
          not: null
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return signingKey ? this.mapToSigningKey(signingKey) : undefined
  }

  async insert(signingKey: SigningKey): Promise<void> {
    await this.prismaClient.signingKey.create({
      data: this.mapToPrismaSigningKey(signingKey)
    })
  }

  async update(signingKey: SigningKey): Promise<void> {
    await this.prismaClient.signingKey.update({
      where: { id: signingKey.id, updatedAt: signingKey.originalUpdatedAt },
      data: this.mapToPrismaSigningKey(signingKey)
    })

    signingKey.commit()
  }

  async delete(signingKey: SigningKey): Promise<void> {
    await this.prismaClient.signingKey.delete({
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
