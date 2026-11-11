import type { en } from '../en'
import { common } from './common'
import { nav } from './nav'
import { errors } from './errors'
import { instruments } from './instruments'
import { portfolio } from './portfolio'
import { search } from './search'
import { orders } from './orders'
import { validation } from './validation'

export const es = {
  common,
  nav,
  errors,
  instruments,
  portfolio,
  search,
  orders,
  validation,
} satisfies typeof en
