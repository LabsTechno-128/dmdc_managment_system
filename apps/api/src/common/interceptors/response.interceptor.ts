import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';

import { map } from 'rxjs/operators';


@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        return next.handle().pipe(
            map((data: any) => ({
                success: true,
                message: data?.message ?? 'Success',
                data: data?.data ?? data,
                meta: data?.meta ?? null,
                timestamp: new Date().toISOString(),
            })) as any,
        );
    }
}