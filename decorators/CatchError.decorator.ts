import { HttpException, HttpStatus } from '@nestjs/common';

export type Handler = (
  error: any,
  propertyKey: string | symbol,
) => Promise<void> | void;

const defaultHandler: Handler = (error: any, propertyKey: string | symbol) => {
  console.error(`Error in method ${String(propertyKey)}:`, error);
  if (error instanceof HttpException) throw error;
  throw new HttpException('Invaild Request', HttpStatus.BAD_REQUEST);
};

export function CatchError(handler: Handler = defaultHandler): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error: any) {
        await handler(error, propertyKey);
      }
    };

    return descriptor;
  };
}
