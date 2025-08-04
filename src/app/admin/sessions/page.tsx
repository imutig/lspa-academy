import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function AdminSessions() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'DIRECTEUR' && session.user.role !== 'SUPERVISEUR')) {
    redirect('/')
  }

  const sessions = await prisma.session.findMany({
    include: {
      _count: {
        select: { candidates: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Gestion des Sessions
              </h1>
              <p className="text-blue-200">
                Créez et gérez les sessions de Police Academy
              </p>
            </div>
            <div className="flex gap-4">
              <Link 
                href="/admin/sessions/create"
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Nouvelle Session
              </Link>
              <Link 
                href="/admin/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Retour Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Liste des sessions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-blue-200 mb-4">Aucune session créée pour le moment.</p>
              <Link 
                href="/admin/sessions/create"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Créer la première session
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((sessionItem: any) => (
                <div
                  key={sessionItem.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {sessionItem.name}
                      </h3>
                      <p className="text-blue-200 mb-3">
                        {sessionItem.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm px-3 py-1 rounded ${
                          sessionItem.status === 'PLANNED' ? 'bg-yellow-500/20 text-yellow-200' :
                          sessionItem.status === 'ACTIVE' ? 'bg-green-500/20 text-green-200' :
                          'bg-gray-500/20 text-gray-200'
                        }`}>
                          {sessionItem.status}
                        </span>
                        <span className="text-sm text-blue-200">
                          {sessionItem._count.candidates} candidat(s) inscrit(s)
                        </span>
                        <span className="text-sm text-blue-300">
                          Créée le {new Date(sessionItem.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/admin/sessions/${sessionItem.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
                      >
                        Voir
                      </Link>
                      {sessionItem.status === 'PLANNED' && (
                        <button className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded transition-colors">
                          Activer
                        </button>
                      )}
                      {sessionItem.status === 'ACTIVE' && (
                        <button className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded transition-colors">
                          Clôturer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
