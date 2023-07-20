import { z } from "zod";

export const getContactShema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "email is required",
      })
      .email("Not a valid email")
      .optional(),
    phoneNumber: z
      .string({
        required_error: "phone number is required",
      })
      .optional(),
  }),
});
