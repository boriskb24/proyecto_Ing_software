import { defineConfig } from '@adonisjs/inertia'

const inertiaConfig = defineConfig({
  /**
   * Server-side rendering options.
   */
  ssr: {
    /**
     * Toggle SSR mode for Inertia pages.
     */
    enabled: false,

    /**
     * Entry file used by the SSR server build.
     */
    entrypoint: 'inertia/ssr.tsx',
  },

  /**
   * Datos compartidos globalmente con todas las vistas de Inertia
   */
  sharedData: {
    auth: async (ctx) => {
      try {
        await ctx.auth?.use('web')?.check()
      } catch {}

      const user = ctx.auth?.use('web')?.user

      return {
        user: user
          ? {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              role: user.role,
            }
          : null,
      }
    },
  },
})

export default inertiaConfig
