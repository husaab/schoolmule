import { describe, it, expect } from 'vitest'
import {
  applyMapping,
  guessRole,
  guessRoles,
  looksLikeHeader,
  mappingProblems,
  parseGrade,
  parsePasted,
  unsavedCsv,
} from './studentEmailImport'

describe('guessRole', () => {
  it('reads the Google Admin export headers', () => {
    expect(['First Name', 'Last Name', 'Email Address', 'Org Unit Path', 'Phone'].map(guessRole))
      .toEqual(['first_name', 'last_name', 'email', 'grade', 'ignore'])
  })
  it('knows the usual spellings', () => {
    expect(guessRole('E-mail')).toBe('email')
    expect(guessRole('Student email')).toBe('email')
    expect(guessRole('Given name')).toBe('first_name')
    expect(guessRole('Surname')).toBe('last_name')
    expect(guessRole('Family name')).toBe('last_name')
    expect(guessRole('Student')).toBe('full_name')
    expect(guessRole('Full name')).toBe('full_name')
    expect(guessRole('Grade')).toBe('grade')
    expect(guessRole('Notes')).toBe('ignore')
  })
  it('never guesses the same role twice', () => {
    expect(guessRoles(['Email', 'Backup email', 'Name'])).toEqual(['email', 'ignore', 'full_name'])
  })
})

describe('parseGrade', () => {
  it.each([
    ['5', '5'], ['Grade 5', '5'], ['Gr. 5', '5'], ['gr5', '5'], ['/Students/Grade 5', '5'], ['G8', '8'],
    ['JK', 'JK'], ['Junior Kindergarten', 'JK'], ['sk', 'SK'], ['Senior Kindergarten', 'SK'],
  ])('reads %p as %p', (raw, grade) => {
    expect(parseGrade(raw)).toBe(grade)
  })
  it.each([['Kindergarten'], [''], ['Grade 9'], ['12'], ['Staff']])('cannot read %p', (raw) => {
    expect(parseGrade(raw)).toBeNull()
  })
})

describe('parsePasted', () => {
  it('splits on tabs first (a paste from a spreadsheet), else commas, else semicolons', () => {
    expect(parsePasted('Amal Haddad\tamal.haddad@example.com\nYusuf Omar\tyusuf.omar@example.com')).toEqual([
      ['Amal Haddad', 'amal.haddad@example.com'],
      ['Yusuf Omar', 'yusuf.omar@example.com'],
    ])
    expect(parsePasted('"Haddad, Amal", amal.haddad@example.com\r\n\r\nYusuf Omar;yusuf.omar@example.com')).toEqual([
      ['Haddad, Amal', 'amal.haddad@example.com'],
      ['Yusuf Omar', 'yusuf.omar@example.com'],
    ])
  })
})

describe('looksLikeHeader', () => {
  it('is a header when no cell is an address', () => {
    expect(looksLikeHeader(['First Name', 'Email Address'])).toBe(true)
    expect(looksLikeHeader(['Amal Haddad', 'amal.haddad@example.com'])).toBe(false)
  })
})

describe('applyMapping', () => {
  const rows = [
    ['First Name', 'Last Name', 'Email Address', 'Org Unit Path'],
    ['Amal', 'Haddad', ' Amal.Haddad@Example.com ', '/Students/Grade 5'],
    ['Yusuf', 'Omar', 'yusuf.omar@example.com', 'Staff'],
    ['', '', '', ''],
  ]
  it('builds name, email and grade from the chosen columns, skipping the header and empty rows', () => {
    expect(applyMapping(rows, ['first_name', 'last_name', 'email', 'grade'], true)).toEqual([
      { index: 1, name: 'Amal Haddad', email: 'amal.haddad@example.com', grade: '5', gradeUnread: false },
      { index: 2, name: 'Yusuf Omar', email: 'yusuf.omar@example.com', grade: null, gradeUnread: true },
    ])
  })
  it('a full-name column wins over first and last', () => {
    expect(applyMapping([['Amal N. Haddad', 'x', 'a@example.com']], ['full_name', 'first_name', 'email'], false))
      .toEqual([{ index: 0, name: 'Amal N. Haddad', email: 'a@example.com', grade: null, gradeUnread: false }])
  })
})

describe('mappingProblems', () => {
  it('needs an email and a name', () => {
    expect(mappingProblems(['full_name', 'ignore'])).toEqual(['Choose the Student email column'])
    expect(mappingProblems(['email', 'first_name'])).toEqual(['Choose Full name, or First name and Last name'])
    expect(mappingProblems(['email', 'full_name'])).toEqual([])
    expect(mappingProblems(['email', 'first_name', 'last_name'])).toEqual([])
  })
  it('names a role chosen twice', () => {
    expect(mappingProblems(['email', 'email', 'full_name'])).toEqual(['Two columns are set to Student email'])
  })
})

describe('unsavedCsv', () => {
  it('quotes commas and quotes, with a header', () => {
    expect(unsavedCsv([
      { name: 'Haddad, Amal', email: 'amal@example.com', why: 'This is a parent\'s address on file.' },
      { name: 'Yusuf "Joe" Omar', email: '', why: 'Not found in 2026–2027' },
    ])).toBe(
      'Name,Email,Why\r\n"Haddad, Amal",amal@example.com,This is a parent\'s address on file.\r\n"Yusuf ""Joe"" Omar",,Not found in 2026–2027\r\n',
    )
  })
})
