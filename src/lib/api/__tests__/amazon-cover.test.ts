import {
  findAmazonCoverByISBN,
  getAmazonCoverUrl,
  isbn13ToIsbn10,
  resolveAmazonCoverAsin,
} from '../amazon-cover'

beforeEach(() => jest.restoreAllMocks())

describe('amazon cover fallback', () => {
  it('converts 978 ISBN-13 to ISBN-10/ASIN', () => {
    expect(isbn13ToIsbn10('9780553293357')).toBe('0553293354')
    expect(resolveAmazonCoverAsin({ isbn13: '978-0-553-29335-7' })).toBe(
      '0553293354',
    )
  })

  it('does not derive ISBN-10 from 979 ISBN-13', () => {
    expect(isbn13ToIsbn10('9791090636071')).toBeNull()
  })

  it('builds the canonical Amazon image URL', () => {
    expect(getAmazonCoverUrl('0553293354')).toBe(
      'https://m.media-amazon.com/images/P/0553293354.01._SCLZZZZZZZ_.jpg',
    )
  })

  it('validates cover existence via HEAD before returning the URL', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      ok: true,
    } as Response)

    await expect(
      findAmazonCoverByISBN({ isbn13: '9780553293357' }),
    ).resolves.toBe(getAmazonCoverUrl('0553293354'))
  })

  it('returns null when Amazon does not return an image', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      headers: new Headers({ 'content-type': 'text/html' }),
      ok: true,
    } as Response)

    await expect(
      findAmazonCoverByISBN({ isbn13: '9780553293357' }),
    ).resolves.toBeNull()
  })
})
