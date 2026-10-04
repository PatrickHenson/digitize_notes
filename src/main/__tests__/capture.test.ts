import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { queueCapturedImage, queueImportedImages } from '../capture'

describe('queueCapturedImage / queueImportedImages', () => {
  let notebookDir: string
  const title = 'Test Notebook'

  beforeEach(async () => {
    notebookDir = await fs.mkdtemp(join(tmpdir(), 'digitize-notes-test-'))
    await fs.mkdir(join(notebookDir, 'images'), { recursive: true })
    await fs.mkdir(join(notebookDir, 'pending_processing'), { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(notebookDir, { recursive: true, force: true })
  })

  it('assigns id 0001 to the first captured image', async () => {
    const page = await queueCapturedImage(notebookDir, title, Buffer.from('fake-png'))
    expect(page.id).toBe('0001')
    expect(page.fileName).toBe('Test Notebook_0001.png')
    await expect(fs.access(page.path)).resolves.toBeUndefined()
  })

  it('increments past ids already committed to images/', async () => {
    await fs.writeFile(join(notebookDir, 'images', 'Test Notebook_0003.png'), 'x')
    const page = await queueCapturedImage(notebookDir, title, Buffer.from('fake-png'))
    expect(page.id).toBe('0004')
  })

  it('increments past ids already sitting in pending_processing/', async () => {
    await fs.writeFile(join(notebookDir, 'pending_processing', 'Test Notebook_0002.jpg'), 'x')
    const page = await queueCapturedImage(notebookDir, title, Buffer.from('fake-png'))
    expect(page.id).toBe('0003')
  })

  it('assigns sequential ids to a batch import, not duplicate ones', async () => {
    const source1 = join(notebookDir, 'src1.png')
    const source2 = join(notebookDir, 'src2.jpg')
    await fs.writeFile(source1, 'a')
    await fs.writeFile(source2, 'b')

    const pages = await queueImportedImages(notebookDir, title, [source1, source2])
    expect(pages.map((p) => p.id)).toEqual(['0001', '0002'])
  })

  it('rejects an unsupported file extension', async () => {
    const source = join(notebookDir, 'scan.pdf')
    await fs.writeFile(source, 'x')
    await expect(queueImportedImages(notebookDir, title, [source])).rejects.toThrow(
      /only jpg, jpeg, png/
    )
  })
})
