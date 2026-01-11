import { z } from "zod";

// Booking form validation schema
export const bookingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  phone: z
    .string()
    .trim()
    .min(1, { message: "Phone is required" })
    .max(20, { message: "Phone must be less than 20 characters" })
    .regex(/^(\+886|0)?[0-9\-\s]{8,15}$/, { 
      message: "Please enter a valid phone number" 
    }),
  lineId: z
    .string()
    .trim()
    .max(50, { message: "LINE ID must be less than 50 characters" })
    .optional()
    .or(z.literal("")),
  store: z.enum(["yuanhua", "zhongfu"], {
    errorMap: () => ({ message: "Please select a store" }),
  }),
  date: z
    .string()
    .min(1, { message: "Date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format" }),
  time: z
    .string()
    .min(1, { message: "Time is required" }),
  service: z.enum(["nail", "lash", "tattoo", "waxing"], {
    errorMap: () => ({ message: "Please select a service" }),
  }),
  notes: z
    .string()
    .trim()
    .max(500, { message: "Notes must be less than 500 characters" })
    .optional()
    .or(z.literal("")),
  privacy: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must agree to the privacy policy",
    }),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

// Quote send form validation schema
export const quoteSendSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  contact: z
    .string()
    .trim()
    .min(1, { message: "Contact is required" })
    .max(100, { message: "Contact must be less than 100 characters" }),
  sendMethod: z.enum(["line", "email", "booking"], {
    errorMap: () => ({ message: "Please select a method" }),
  }),
});

export type QuoteSendFormData = z.infer<typeof quoteSendSchema>;

// Lead capture form validation schema
export const leadCaptureSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  phone: z
    .string()
    .trim()
    .max(20, { message: "Phone must be less than 20 characters" })
    .optional()
    .or(z.literal("")),
  line_id: z
    .string()
    .trim()
    .max(50, { message: "LINE ID must be less than 50 characters" })
    .optional()
    .or(z.literal("")),
  service_interest: z.enum(["nail", "lash", "tattoo", "waxing"], {
    errorMap: () => ({ message: "Please select a service" }),
  }),
  booking_timeframe: z
    .string()
    .max(50)
    .optional()
    .or(z.literal("")),
  consent_promotions: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must agree to receive promotions",
    }),
});

export type LeadCaptureFormData = z.infer<typeof leadCaptureSchema>;
