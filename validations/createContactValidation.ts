import type { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError, z } from "zod";

export const createContactShema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "email is required",
      })
      .email("Not a valid email"),
    phoneNumber: z.string({
      required_error: "phone number is required",
    }),
  }),
});

export async function zParse<T extends AnyZodObject>(
  schema: T,
  req: Request,
  res: Response
): Promise<IzParse<T>> {
  try {
    const parsedData = await schema.parseAsync({ body: req.body }); // Assuming the data is in the request body
    return { type: parsedData, error: "" };
  } catch (error) {
    if (error instanceof ZodError) {
      //   console.error("ZodError:", error.errors[0]);
      return { error: error.errors[0].message };
    }
    // console.error("Unexpected Error- asadasdas:", error);
    return { error: "Unexpected error occurred." };
  }
}

interface IzParse<T extends AnyZodObject> {
  type?: z.infer<T>;
  error?: string;
}
