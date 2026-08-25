import { z } from 'zod';

export const CreateCountrySchema = z.object({
    name: z.string().min(2, "Country name must be at least 2 characters long")
});

export const CreateCitySchema = z.object({
    name: z.string().min(2, "City name must be at least 2 characters long"),
    countryId: z.string().uuid("Invalid countryId")
});

export const CreateDistrictSchema = z.object({
    name: z.string().min(1, "District name cannot be empty"),
    cityId: z.string().uuid("Invalid cityId")
});

export const UpdateDistrictStatusSchema = z.object({
    is_available: z.boolean()
});
