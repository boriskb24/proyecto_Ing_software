/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  root: {
    login: typeof routes['root.login']
  }
  login: {
    create: typeof routes['login.create']
    store: typeof routes['login.store']
  }
  register: {
    create: typeof routes['register.create']
    store: typeof routes['register.store']
  }
  dashboard: typeof routes['dashboard']
  home: typeof routes['home']
  logout: typeof routes['logout']
}
