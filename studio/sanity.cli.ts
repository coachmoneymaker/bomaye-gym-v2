import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    // TODO: Replace with your actual Sanity project ID from sanity.io/manage
    projectId: 'REPLACE_WITH_PROJECT_ID',
    dataset: 'production',
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdatesEnabled: true,
})
