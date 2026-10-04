import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { CreateNotebookInput, NotebookSummary } from '../shared/notebook'
import type { QueuedPage } from '../shared/capture'

const api = {
  notebook: {
    selectParentDirectory: (): Promise<string | null> =>
      ipcRenderer.invoke('dialog:selectParentDirectory'),
    create: (input: CreateNotebookInput): Promise<NotebookSummary> =>
      ipcRenderer.invoke('notebook:create', input),
    promptOpen: (): Promise<NotebookSummary | null> => ipcRenderer.invoke('notebook:promptOpen')
  },
  capture: {
    queueImage: (
      notebookDir: string,
      notebookTitle: string,
      imageData: ArrayBuffer
    ): Promise<QueuedPage> =>
      ipcRenderer.invoke('capture:queueImage', notebookDir, notebookTitle, imageData),
    promptImportImages: (
      notebookDir: string,
      notebookTitle: string
    ): Promise<QueuedPage[] | null> =>
      ipcRenderer.invoke('capture:promptImportImages', notebookDir, notebookTitle)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

export type Api = typeof api
