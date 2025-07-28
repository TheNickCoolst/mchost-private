interface ApiMinecraftVersion {
  id: string
  name: string
  type: 'release' | 'snapshot' | 'legacy'
  recommended?: boolean
  description?: string
  releaseDate?: string
}

interface ApiServerType {
  id: string
  name: string
  description: string
  supportsPlugins: boolean
  supportsMods: boolean
  modLoaderType?: 'forge' | 'fabric' | 'quilt'
}

const API_BASE = '/api/minecraft'

export const minecraftApi = {
  async getVersions(): Promise<ApiMinecraftVersion[]> {
    const response = await fetch(`${API_BASE}/versions`)
    if (!response.ok) {
      throw new Error('Failed to fetch Minecraft versions')
    }
    return response.json()
  },

  async getServerTypes(): Promise<ApiServerType[]> {
    const response = await fetch(`${API_BASE}/server-types`)
    if (!response.ok) {
      throw new Error('Failed to fetch server types')
    }
    return response.json()
  },

  async getCompatibleVersions(serverType: string): Promise<ApiMinecraftVersion[]> {
    const response = await fetch(`${API_BASE}/versions/compatible/${serverType}`)
    if (!response.ok) {
      throw new Error('Failed to fetch compatible versions')
    }
    return response.json()
  }
}