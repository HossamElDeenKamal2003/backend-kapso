import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AppGuard implements CanActivate {
  private publics: string[] = [];
  private access: string = process.env.SERVER_ACCESS;

  private isPublic(path: string) {
    for (const index in this.publics)
      if (path.includes(this.publics[index])) return true;
    return false;
  }

  private handleHTTP(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const path: string = request?.path;
    if (this.isPublic(path)) return true;
    const access: string = request.headers['x-server-access'];
    return access === this.access;
  }

  private handleWS(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const access = client.handshake?.serverAccess;
    return access === this.access;
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctxType = context.getType();
    switch (ctxType) {
      case 'http':
        return this.handleHTTP(context);
      case 'ws':
        return this.handleWS(context);
      default:
        return false;
    }
  }
}
