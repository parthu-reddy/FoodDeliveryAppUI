import { z } from 'zod';

export const menuItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  category: z.string().optional(),
  rating: z.number().optional(),
  isVeg: z.boolean().optional(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  prepTimeMinutes: z.number().optional(),
}).passthrough();

export type MenuItem = z.infer<typeof menuItemSchema>;

export const cartItemSchema = z.object({
  item: menuItemSchema,
  quantity: z.number(),
}).passthrough();

export type CartItem = z.infer<typeof cartItemSchema>;
