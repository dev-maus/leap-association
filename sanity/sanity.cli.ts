import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '327wp4ja',
    dataset: 'production'
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: true,
    appId: 'khzw9al7q8b27htb225s42ve'
  }
})
