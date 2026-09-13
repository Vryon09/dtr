import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with structured field errors on failure.
 */
export function validate(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      res.status(400).json({
        success: false,
        errors,
      });

      return;
    }

    // Replace req.body with parsed/coerced/stripped data
    req.body = result.data;
    next();
  };
}
