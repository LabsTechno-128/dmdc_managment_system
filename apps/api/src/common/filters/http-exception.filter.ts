import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();

        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        let message: string | string[] = 'Internal server error';
        let errors: any = null;

        if (exception instanceof HttpException) {
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const res = exceptionResponse as any;
                message = res.message ?? 'Request failed';
                errors = res.errors ?? null;
            }
        } else if (exception instanceof Error) {
            // Log the error to the backend console for debugging
            console.error('[Unhandled Exception]:', exception);
            message = exception.message || 'Internal server error';
        } else {
            console.error('[Unhandled Exception]:', exception);
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            message,
            errors,
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}