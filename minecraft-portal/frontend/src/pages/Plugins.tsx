import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUIMode } from '../contexts/UIModeContext'
import { Package, Download, Star, Search, Filter } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface Plugin {
  id: string
  name: string
  description: string
  category: string
  downloads: number
  rating: number
  version: string
  icon: string
}

const Plugins: React.FC = () => {
  const { isSimpleMode } = useUIMode()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: isSimpleMode ? 'Alle' : 'All', emoji: '📦' },
    { id: 'fun', name: isSimpleMode ? 'Spaß & Spiele' : 'Fun & Games', emoji: '🎮' },
    { id: 'admin', name: isSimpleMode ? 'Verwaltung' : 'Administration', emoji: '⚙️' },
    { id: 'economy', name: isSimpleMode ? 'Wirtschaft' : 'Economy', emoji: '💰' },
    { id: 'protection', name: isSimpleMode ? 'Schutz' : 'Protection', emoji: '🛡️' },
    { id: 'world', name: isSimpleMode ? 'Welt-Generierung' : 'World Gen', emoji: '🌍' },
  ]

  const mockPlugins: Plugin[] = [
    {
      id: '1',
      name: 'EssentialsX',
      description: isSimpleMode
        ? 'Die wichtigsten Befehle für deinen Server - teleportieren, Items spawnen und mehr!'
        : 'Essential commands and features for server administration',
      category: 'admin',
      downloads: 50000000,
      rating: 4.8,
      version: '2.20.1',
      icon: '⚡'
    },
    {
      id: '2',
      name: 'WorldEdit',
      description: isSimpleMode
        ? 'Baue riesige Strukturen super schnell! Perfekt für kreative Builds.'
        : 'Powerful in-game world editor for creative building',
      category: 'world',
      downloads: 30000000,
      rating: 4.9,
      version: '7.2.15',
      icon: '🔨'
    },
    {
      id: '3',
      name: 'LuckPerms',
      description: isSimpleMode
        ? 'Verwalte, wer was darf - mache Freunde zu Admins oder Moderatoren!'
        : 'Advanced permissions management system',
      category: 'admin',
      downloads: 25000000,
      rating: 4.9,
      version: '5.4.102',
      icon: '🔐'
    },
    {
      id: '4',
      name: 'Vault',
      description: isSimpleMode
        ? 'Wichtig für viele andere Plugins - brauchst du wahrscheinlich!'
        : 'Permission and economy API for plugin developers',
      category: 'admin',
      downloads: 40000000,
      rating: 4.7,
      version: '1.7.3',
      icon: '🏦'
    },
    {
      id: '5',
      name: 'GriefPrevention',
      description: isSimpleMode
        ? 'Schütze deine Builds vor Griefern - markiere dein Grundstück!'
        : 'Land claiming and grief prevention system',
      category: 'protection',
      downloads: 15000000,
      rating: 4.6,
      version: '16.18',
      icon: '🛡️'
    },
    {
      id: '6',
      name: 'mcMMO',
      description: isSimpleMode
        ? 'RPG-System für Minecraft - levele deine Fähigkeiten!'
        : 'RPG leveling and skills system for Minecraft',
      category: 'fun',
      downloads: 20000000,
      rating: 4.8,
      version: '2.1.220',
      icon: '⚔️'
    },
  ]

  const filteredPlugins = mockPlugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
          <Package className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          {isSimpleMode ? '🔌 Plugin Store' : '🔌 Plugin Marketplace'}
        </h1>
        <p className="text-gray-400 text-lg">
          {isSimpleMode
            ? 'Füge coole Features zu deinem Server hinzu!'
            : 'Extend your server with powerful plugins'}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isSimpleMode ? 'Suche nach Plugins...' : 'Search plugins...'}
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{category.emoji}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Popular Notice for Simple Mode */}
      {isSimpleMode && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Star className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <strong>💡 Tipp:</strong> Wenn du neu bist, probiere erstmal EssentialsX und WorldEdit -
              die sind super für den Anfang!
            </div>
          </div>
        </div>
      )}

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlugins.map(plugin => (
          <div
            key={plugin.id}
            className="bg-gray-800 rounded-xl border border-gray-700 hover:border-purple-500 transition-all overflow-hidden group"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{plugin.icon}</div>
                <div className="flex items-center space-x-1 text-yellow-400">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{plugin.rating}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{plugin.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{plugin.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>v{plugin.version}</span>
                <span>{(plugin.downloads / 1000000).toFixed(1)}M downloads</span>
              </div>

              <button
                onClick={() => toast.success(isSimpleMode ? '✨ Plugin wird installiert!' : 'Plugin installed!')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{isSimpleMode ? 'Installieren' : 'Install'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPlugins.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            {isSimpleMode ? 'Keine Plugins gefunden' : 'No plugins found'}
          </h3>
          <p className="text-gray-500">
            {isSimpleMode ? 'Versuche einen anderen Suchbegriff' : 'Try adjusting your search or filters'}
          </p>
        </div>
      )}
    </div>
  )
}

export default Plugins
