import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory.
 * Usage: router.post('/route', validate(MySchema), handler)
 *        router.get('/route', validate(QuerySchema, 'query'), handler)
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(result.error); // Picked up by errorHandler as ZodError → 400
      return;
    }
    // Replace req[target] with the parsed + coerced data
    req[target] = result.data;
    next();
  };
}
