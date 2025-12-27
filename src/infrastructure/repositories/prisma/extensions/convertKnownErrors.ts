import { Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '~/domain/errors';

export const convertKnownErrors = () => ({
  query: {
    $allModels: {
      async $allOperations({
        args,
        query,
      }: {
        args: any;
        query: (args: any) => Prisma.PrismaPromise<any>;
      }): Promise<any> {
        try {
          return await query(args);
        } catch (error: unknown) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
              const resource = error.meta?.modelName ?? 'Resource';
              const fields = error.meta?.target as string[];
              const message = `${resource} with same ${fields.join(' and ')} already exists.`;
              throw new ValidationError(message);
            }

            if (error.code === 'P2025') {
              throw new NotFoundError('The resource you are trying to access does not exist.');
            }
          }

          throw error;
        }
      },
    },
  },
});
