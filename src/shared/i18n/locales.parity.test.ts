import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { es } from './locales/es'

type Tree = { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') acc[path] = value
    else Object.assign(acc, flatten(value, path))
    return acc
  }, {})
}

const enEntries = flatten(en)
const esEntries = flatten(es)

describe('locale resources', () => {
  it('EN and ES have identical keys', () => {
    expect(Object.keys(esEntries).sort()).toEqual(Object.keys(enEntries).sort())
  })

  it('EN and ES have identical namespaces', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort())
  })

  it.each([
    ['en', enEntries],
    ['es', esEntries],
  ])('%s has no empty translation values', (_locale, entries) => {
    const empty = Object.entries(entries).filter(([, value]) => value.trim() === '')
    expect(empty).toEqual([])
  })
})
