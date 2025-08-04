import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import LogoutButton from "@/components/LogoutButton"

export default async function InstructorDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'INSTRUCTEUR') {
    redirect('/')
  }

  // Récupérer les sessions actives
  const activeSessions = await prisma.session.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      candidates: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      },
      _count: {
        select: { candidates: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Récupérer mes entretiens récents
  const myInterviews = await prisma.interview.findMany({
    where: {
      interviewerId: session.user.id
    },
    include: {
      candidate: {
        select: {
          id: true,
          username: true,
          email: true
        }
      },
      session: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Dashboard Instructeur
              </h1>
              <p className="text-blue-200">
                Bienvenue, <span className="font-medium">{session.user.firstName && session.user.lastName ? `${session.user.firstName} ${session.user.lastName}` : session.user.username}</span>
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sessions actives */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Sessions Actives</h2>
            
            {activeSessions.length === 0 ? (
              <p className="text-blue-200">Aucune session active pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {activeSessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <h3 className="font-medium text-white mb-2">{session.name}</h3>
                    <p className="text-sm text-blue-200 mb-2">{session.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-200">
                        {session._count.candidates} candidat(s)
                      </span>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded transition-colors">
                        Voir détails
                      </button>
                    </div>
                    
                    {session.candidates.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-blue-300 mb-2">Candidats:</p>
                        <div className="space-y-1">
                          {session.candidates.slice(0, 3).map((candidate: any) => (
                            <div key={candidate.id} className="flex justify-between items-center">
                              <span className="text-sm text-white">{candidate.user.firstName && candidate.user.lastName ? `${candidate.user.firstName} ${candidate.user.lastName}` : candidate.user.username}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                candidate.status === 'REGISTERED' ? 'bg-yellow-500/20 text-yellow-200' :
                                candidate.status === 'VALIDATED' ? 'bg-green-500/20 text-green-200' :
                                'bg-blue-500/20 text-blue-200'
                              }`}>
                                {candidate.status}
                              </span>
                            </div>
                          ))}
                          {session.candidates.length > 3 && (
                            <p className="text-xs text-blue-300">
                              +{session.candidates.length - 3} autres...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mes entretiens récents */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Mes Entretiens Récents</h2>
            
            {myInterviews.length === 0 ? (
              <p className="text-blue-200">Aucun entretien effectué.</p>
            ) : (
              <div className="space-y-4">
                {myInterviews.map((interview: any) => (
                  <div
                    key={interview.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-white">{interview.candidate.username}</h3>
                        <p className="text-sm text-blue-200">{interview.session.name}</p>
                      </div>
                      {interview.decision && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          interview.decision === 'FAVORABLE' ? 'bg-green-500/20 text-green-200' :
                          interview.decision === 'DEFAVORABLE' ? 'bg-red-500/20 text-red-200' :
                          'bg-orange-500/20 text-orange-200'
                        }`}>
                          {interview.decision}
                        </span>
                      )}
                    </div>
                    {interview.notes && (
                      <p className="text-sm text-blue-200 mt-2">{interview.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
