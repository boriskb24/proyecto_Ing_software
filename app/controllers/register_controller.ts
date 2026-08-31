import User from '#models/user'
import { registerValidator } from '#validators/register'
import type { HttpContext } from '@adonisjs/core/http'

export default class RegisterController {
  /**
   * Renderiza el formulario de registro con Inertia
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }

  /**
   * Valida, guarda al usuario y lo redirige al login para que inicie sesión manualmente
   */
  async store({ request, response }: HttpContext) {
    // 1. Validar los datos ingresados
    const { password_confirmation, ...payload } = await request.validateUsing(registerValidator)

    // 2. Crear usuario en la base de datos
    await User.create(payload)

    // 3. Redirigir a la pantalla de Login
    return response.redirect('/login')
  }
}
