import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { CreateNotebookInput, NotebookSummary } from '../shared/notebook'

const api = {
  notebook: {
    selectParentDirectory: (): Promise<string | null> =>
      ipcRenderer.invoke('dialog:selectParentDirectory'),
    create: (input: CreateNotebookInput): Promise<NotebookSummary> =>
      ipcRenderer.invoke('notebook:create', input),
    promptOpen: (): Promise<NotebookSummary | null> => ipcRenderer.invoke('notebook:promptOpen')
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
