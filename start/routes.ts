/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const SessionController = () => import('#controllers/session_controller')
const RegisterController = () => import('#controllers/register_controller')

// ─── Rutas para usuarios NO autenticados (Página Inicial: Login) ───
router
  .group(() => {
    // La raíz "/" abre directamente el formulario de Login
    router.get('/', [SessionController, 'create']).as('root.login')
    router.get('/login', [SessionController, 'create']).as('login.create')
    router.post('/login', [SessionController, 'store']).as('login.store')

    // Registro
    router.get('/register', [RegisterController, 'create']).as('register.create')
    router.post('/register', [RegisterController, 'store']).as('register.store')
  })
  .use(middleware.guest())

// ─── Rutas para usuarios autenticados (Dashboard / Home) ───
router
  .group(() => {
    // Panel principal (accesible al iniciar sesión)
    router.on('/dashboard').renderInertia('home', {}).as('dashboard')
    router.on('/home').renderInertia('home', {}).as('home')

    // Cerrar sesión
    router.post('/logout', [SessionController, 'destroy']).as('logout')
  })
  .use(middleware.auth())
