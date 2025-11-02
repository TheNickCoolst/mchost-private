import React, { useState } from 'react'
import { useUIMode } from '../contexts/UIModeContext'
import {
  HelpCircle,
  BookOpen,
  Video,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Server,
  Users,
  Settings,
  Zap
} from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
  category: 'getting-started' | 'server' | 'technical' | 'billing'
}

const Help: React.FC = () => {
  const { isSimpleMode } = useUIMode()
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      question: isSimpleMode ? 'Wie erstelle ich meinen ersten Server?' : 'How do I create my first server?',
      answer: isSimpleMode
        ? 'Klicke auf den großen grünen Button "Server erstellen" auf der Startseite. Wähle dann einen Namen und wie viele Spieler mitspielen sollen. Fertig! 🎮'
        : 'Click on the "Create Server" button on the dashboard. Select your desired resources, Minecraft version, and server type. The system will automatically provision your server.',
      category: 'getting-started'
    },
    {
      question: isSimpleMode ? 'Wie starte ich meinen Server?' : 'How do I start my server?',
      answer: isSimpleMode
        ? 'Gehe zu deinem Server und klicke auf den grünen "Starten" Button. Nach ein paar Sekunden ist dein Server online! ▶️'
        : 'Navigate to your server details page and click the "Start" button. The server will initialize and be ready in a few moments.',
      category: 'server'
    },
    {
      question: isSimpleMode ? 'Wie lade ich Freunde ein?' : 'How do I invite friends to my server?',
      answer: isSimpleMode
        ? 'Schau in den Server-Einstellungen nach der Server-Adresse. Gib diese deinen Freunden, und sie können beitreten! 👥'
        : 'Share your server address (IP:Port) with friends. You can find this in the server details page. They can connect using this address in Minecraft multiplayer.',
      category: 'getting-started'
    },
    {
      question: isSimpleMode ? 'Was sind Plugins?' : 'What are plugins and how do I install them?',
      answer: isSimpleMode
        ? 'Plugins sind wie Apps für deinen Server - sie fügen coole neue Features hinzu! Gehe zu "Plugins" und wähle aus, was dir gefällt. 🔌'
        : 'Plugins extend your server functionality. Navigate to the Plugins page, browse available plugins, and click "Install". Restart your server for changes to take effect.',
      category: 'server'
    },
    {
      question: isSimpleMode ? 'Mein Server startet nicht - was tun?' : 'My server won\'t start - what should I do?',
      answer: isSimpleMode
        ? 'Keine Panik! Schau in die Konsole (💬 Tab) - dort siehst du, was los ist. Oft hilft ein Neustart. Wenn nicht, kontaktiere den Support! 🆘'
        : 'Check the console logs for error messages. Common issues include incompatible plugins, insufficient memory, or corrupted worlds. Try restarting or removing recently added plugins.',
      category: 'technical'
    },
    {
      question: isSimpleMode ? 'Wie ändere ich die Server-Einstellungen?' : 'How do I change server settings?',
      answer: isSimpleMode
        ? 'Gehe zu deinem Server und klicke auf "⚙️ Einstellungen". Dort kannst du alles anpassen - Spielmodus, Schwierigkeit, und vieles mehr!'
        : 'Navigate to your server and select the "Settings" tab. You can modify server.properties including game mode, difficulty, PvP settings, and more.',
      category: 'server'
    },
    {
      question: isSimpleMode ? 'Was bedeuten RAM, CPU und Speicher?' : 'What are RAM, CPU, and Disk resources?',
      answer: isSimpleMode
        ? 'RAM = wie viel dein Server gleichzeitig machen kann. CPU = wie schnell er ist. Speicher = wie viel Platz für deine Welt. Mehr Spieler = mehr braucht man! 💪'
        : 'RAM affects how many players and plugins you can run. CPU determines server performance and tick rate. Disk space is for worlds, backups, and plugins. Scale based on player count.',
      category: 'technical'
    },
    {
      question: isSimpleMode ? 'Kann ich die Größe später ändern?' : 'Can I upgrade or downgrade my server later?',
      answer: isSimpleMode
        ? 'Ja! Du kannst jederzeit mehr RAM, CPU oder Speicher hinzufügen oder entfernen. Gehe einfach zu den Server-Einstellungen. 📈'
        : 'Yes, you can scale your server resources at any time. Changes take effect after the next server restart. Your data and configuration are preserved.',
      category: 'billing'
    },
  ]

  const tutorials = [
    {
      title: isSimpleMode ? '🎬 Server erstellen für Anfänger' : '🎬 Getting Started Tutorial',
      description: isSimpleMode ? 'Eine einfache Video-Anleitung' : 'Complete walkthrough for beginners',
      duration: '5 min',
      icon: Play
    },
    {
      title: isSimpleMode ? '📚 Plugins installieren' : '📚 Installing Plugins',
      description: isSimpleMode ? 'Coole Features hinzufügen' : 'Add functionality to your server',
      duration: '3 min',
      icon: BookOpen
    },
    {
      title: isSimpleMode ? '⚙️ Server optimieren' : '⚙️ Server Optimization',
      description: isSimpleMode ? 'Mach deinen Server schneller' : 'Performance tuning guide',
      duration: '8 min',
      icon: Zap
    },
    {
      title: isSimpleMode ? '👥 Spieler-Verwaltung' : '👥 Player Management',
      description: isSimpleMode ? 'Admins, Whitelist & Bans' : 'Managing users and permissions',
      duration: '6 min',
      icon: Users
    },
  ]

  const categories = [
    { id: 'getting-started', name: isSimpleMode ? 'Erste Schritte' : 'Getting Started', icon: Play },
    { id: 'server', name: isSimpleMode ? 'Server-Verwaltung' : 'Server Management', icon: Server },
    { id: 'technical', name: isSimpleMode ? 'Technisches' : 'Technical', icon: Settings },
    { id: 'billing', name: isSimpleMode ? 'Bezahlung & Pläne' : 'Billing & Plans', icon: BookOpen },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4">
          <HelpCircle className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          {isSimpleMode ? '❓ Hilfe & Tutorials' : '❓ Help Center'}
        </h1>
        <p className="text-gray-400 text-lg">
          {isSimpleMode ? 'Wir helfen dir gerne weiter!' : 'Everything you need to know'}
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/30 hover:border-blue-500 transition-all cursor-pointer">
          <Video className="h-10 w-10 text-blue-400 mb-3" />
          <h3 className="text-white font-semibold mb-2">
            {isSimpleMode ? '📺 Video-Tutorials' : '📺 Video Tutorials'}
          </h3>
          <p className="text-gray-400 text-sm">
            {isSimpleMode ? 'Schritt-für-Schritt Anleitungen' : 'Step-by-step guides'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/30 hover:border-green-500 transition-all cursor-pointer">
          <BookOpen className="h-10 w-10 text-green-400 mb-3" />
          <h3 className="text-white font-semibold mb-2">
            {isSimpleMode ? '📖 Dokumentation' : '📖 Documentation'}
          </h3>
          <p className="text-gray-400 text-sm">
            {isSimpleMode ? 'Alle Features erklärt' : 'Complete feature reference'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/30 hover:border-purple-500 transition-all cursor-pointer">
          <MessageCircle className="h-10 w-10 text-purple-400 mb-3" />
          <h3 className="text-white font-semibold mb-2">
            {isSimpleMode ? '💬 Support Chat' : '💬 Live Support'}
          </h3>
          <p className="text-gray-400 text-sm">
            {isSimpleMode ? 'Chatte mit uns' : '24/7 support team'}
          </p>
        </div>
      </div>

      {/* Tutorials */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">
          {isSimpleMode ? '🎓 Beliebte Tutorials' : '🎓 Popular Tutorials'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tutorials.map((tutorial, index) => {
            const Icon = tutorial.icon
            return (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-all cursor-pointer group"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500 transition-all">
                    <Icon className="h-6 w-6 text-green-400 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{tutorial.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">{tutorial.description}</p>
                    <span className="text-xs text-gray-500">{tutorial.duration}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">
          {isSimpleMode ? '💡 Häufig gestellte Fragen' : '💡 Frequently Asked Questions'}
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-white font-medium">{faq.question}</span>
                {expandedFAQ === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {expandedFAQ === index && (
                <div className="px-6 py-4 bg-gray-700/30 border-t border-gray-700">
                  <p className="text-gray-300">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border border-green-500/30 text-center">
        <MessageCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          {isSimpleMode ? 'Brauchst du noch Hilfe?' : 'Still need help?'}
        </h2>
        <p className="text-gray-400 mb-6">
          {isSimpleMode
            ? 'Unser Support-Team ist 24/7 für dich da!'
            : 'Our support team is available 24/7 to assist you'}
        </p>
        <button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg">
          {isSimpleMode ? '💬 Chat starten' : '💬 Contact Support'}
        </button>
      </div>
    </div>
  )
}

export default Help
