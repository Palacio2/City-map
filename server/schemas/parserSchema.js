import { z } from "zod";
import { isPbfFileName } from '../services/pbfFiles.js';
import { isPropertyUrl } from '../services/outboundPolicy.js';

const PropertyUrlSchema = z.string().max(4096).refine(value => value === '' || value === '#' || isPropertyUrl(value), {
    message: 'Only HTTPS Otodom property URLs are supported',
});

const DistrictItemSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    is_available: z.boolean().optional(),
}).passthrough();

export const RunParserSchema = z.object({
    cityName: z.string().min(1, "cityName is required").max(100)
        .refine(val => !/["\[\]\\{}]/.test(val), { message: "cityName contains forbidden characters" }),
    districts: z.array(DistrictItemSchema).optional().default([]),
    useOSM: z.boolean().optional().default(false),
    useWAQI: z.boolean().optional().default(false),
    useGUS: z.boolean().optional().default(false),
    useOtodom: z.boolean().optional().default(false),
    enabledSources: z.array(z.string()).optional(),
    propertyUrls: z.record(z.string(), PropertyUrlSchema).optional(),
    otodomUrls: z.record(z.string(), PropertyUrlSchema).optional(),
    countryCode: z.string().min(2).max(5).optional(),
    pbfFileName: z.string().refine(value => value === '' || isPbfFileName(value), {
        message: 'pbfFileName must be a .pbf file name without a path',
    }).optional(),
}).passthrough();
