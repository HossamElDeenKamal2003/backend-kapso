interface CanHandle {
  canHandle(arg: any): boolean;
}
export const getHandler = <T>(handlers: (CanHandle & T)[], arg: any) => {
  for (const handler of handlers) if (handler.canHandle(arg)) return handler;
};
