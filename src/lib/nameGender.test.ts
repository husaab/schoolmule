import { describe, expect, it } from 'vitest'
import { NAME_LISTS, firstNameKey, nameGender } from './nameGender'

describe('nameGender', () => {
  it('reads common spellings of girls’ and boys’ names', () => {
    for (const first of ['Fatima', 'Fatimah', 'Zahra', 'Zahraa', 'Zainab', 'Zaynab', 'Zeinab', 'Mariam', 'Maryam', 'Sayeda', 'Narjis', 'Lea'])
      expect(nameGender(`${first} Example`)).toBe('female')
    for (const first of ['Ali', 'Aly', 'Mohamad', 'Mohammed', 'Muhammad', 'Hussein', 'Hossein', 'Mahdi', 'Mehdi', 'Kumayl', 'John'])
      expect(nameGender(`${first} Example`)).toBe('male')
  })

  it('reads Ala, Alaa and Nahid as girls’ names: at our schools only women carry them', () => {
    for (const first of ['Ala', 'Alaa', "Ala'a", 'Nahid', 'Afsheen', 'Beenish', 'Doha', 'Riham'])
      expect(nameGender(`${first} Example`)).toBe('female')
  })

  it('reads only the first name, never the father’s name after it', () => {
    expect(nameGender('Zahraa Hassan Example')).toBe('female')
    expect(nameGender('Jamal Fatima Example')).toBe('male')
  })

  it('takes every Abd… name as a boy’s', () => {
    expect(nameGender('Abdullah Example')).toBe('male')
    expect(nameGender('Abdel Example')).toBe('male')
    expect(nameGender('Abdulhameed Example')).toBe('male')
  })

  it('ignores case, accents, hyphens and punctuation', () => {
    expect(nameGender('  ZAHRAA example')).toBe('female')
    expect(nameGender('Fatima-Zahra Example')).toBe('female')
    expect(nameGender('Léa Example')).toBe('female')
    expect(firstNameKey("Ru'aya Example")).toBe('ruaya')
  })

  it('says nothing for a name it does not know, or none at all', () => {
    expect(nameGender('Test Student')).toBeNull()
    expect(nameGender('Homeroom Example')).toBeNull()
    expect(nameGender('')).toBeNull()
    expect(nameGender(null)).toBeNull()
  })

  it('never lists a name as both, and has no blank entries', () => {
    for (const name of NAME_LISTS.female) expect(NAME_LISTS.male.has(name)).toBe(false)
    expect(NAME_LISTS.female.has('')).toBe(false)
    expect(NAME_LISTS.male.has('')).toBe(false)
  })
})
