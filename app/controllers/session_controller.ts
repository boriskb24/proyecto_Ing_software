import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  /**
   * Renderiza el formulario de login con Inertia
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  /**
   * Procesa las credenciales, autentica al usuario y lo lleva al Dashboard
   */
  async store({ request, auth, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    const user = await User.verifyCredentials(email, password)
    await auth.use('web').login(user)

    return response.redirect('/dashboard')
  }

  /**
   * Cierra la sesión y regresa a la pantalla de login
   */
  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/')
  }
}
