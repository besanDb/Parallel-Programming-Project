// import {
//   Injectable,
//   NestInterceptor,
//   ExecutionContext,
//   CallHandler,
//   ConflictException,
// } from '@nestjs/common';
// import { Observable } from 'rxjs';

// @Injectable()
// export class ThrottleInterceptor implements NestInterceptor {
//   private storage = new Map<string, NodeJS.Timeout>();

//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const request = context.switchToHttp().getRequest();
//     const input = request.body;

//     const key = this.generateKey(input);
//     const ttl = 5000;

//     if (this.storage.has(key)) {
//       throw new ConflictException('Duplicate request');
//     }

//     this.storage.set(
//       key,
//       setTimeout(() => this.storage.delete(key), ttl),
//     );

//     return next.handle();
//   }

//   private generateKey(input: any): string {
//     const hash = crypto.createHash('sha256');
//     hash.update(JSON.stringify(input));
//     return hash.digest('hex');
//   }
// }
