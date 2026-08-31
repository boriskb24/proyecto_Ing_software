import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

/**
 * Validador para el registro de nuevos usuarios
 */
export const registerValidator = vine.create({
  fullName: vine.string().trim().minLength(3).maxLength(100),
  email: vine
    .string()
    .trim()
    .email()
    .normalizeEmail()
    .maxLength(254)
    .unique({ table: 'users', column: 'email' }),
  password: vine
    .string()
    .minLength(8)
    .maxLength(32)
    .confirmed({ confirmationField: 'password_confirmation' }),
  password_confirmation: vine.string(),
})

export type RegisterSchema = Infer<typeof registerValidator>
