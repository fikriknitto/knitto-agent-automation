import { z } from "zod";

export const mobileDeviceParamsSchema = z.object({
  udid: z.string().min(1),
});

export const mobilePackageParamsSchema = z.object({
  udid: z.string().min(1),
  pkg: z.string().min(1),
});

export const mobilePackagesQuerySchema = z.object({
  q: z.string().optional(),
});
