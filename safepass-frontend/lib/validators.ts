import * as z from "zod";

export const agencyRegistrationSchema = z.object({
  agencyName: z.string().min(3, {
    message: "Agency name must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  address: z.string().min(10, {
    message: "Please enter a complete office address.",
  }),
  licenseNumber: z.string().regex(/^[A-Z0-9-]+$/, {
    message: "Please enter a valid BMET license number.",
  }),
});

export const grievanceSchema = z.object({
  subject: z.string().min(5, {
    message: "Subject must be at least 5 characters.",
  }),
  description: z.string().min(20, {
    message: "Please provide a detailed description of at least 20 characters.",
  }),
  isAnonymous: z.boolean(),
});
