import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!['DIRECTEUR', 'SUPERVISEUR', 'INSTRUCTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const sessionData = await prisma.session.findUnique({
      where: { id },
      include: {
        candidates: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            matricule: 'asc'
          }
        },
        sessionQuizzes: {
          include: {
            quiz: {
              include: {
                _count: {
                  select: {
                    questions: true,
                    attempts: true
                  }
                }
              }
            }
          }
        },
        interviews: {
          include: {
            candidate: {
              select: {
                username: true,
                firstName: true,
                lastName: true
              }
            },
            interviewer: {
              select: {
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            candidates: true,
            interviews: true
          }
        }
      }
    })

    if (!sessionData) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    return NextResponse.json(sessionData)
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!['DIRECTEUR', 'SUPERVISEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    
    // Si c'est une mise à jour de statut de session
    if (body.status) {
      const { status } = body

      if (!status) {
        return NextResponse.json({ error: 'Statut requis' }, { status: 400 })
      }

      const validStatuses = ['PLANNED', 'ACTIVE', 'CLOSED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
      }

      const updatedSession = await prisma.session.update({
        where: { id },
        data: { status }
      })

      console.log('Session mise à jour:', updatedSession.id, 'nouveau statut:', status)
      return NextResponse.json(updatedSession)
    }

    // Si c'est une mise à jour de candidat
    if (body.candidateId) {
      const { candidateId, matricule, candidateStatus } = body

      if (matricule !== undefined) {
        // Mettre à jour le matricule du candidat
        const updatedCandidate = await prisma.sessionCandidate.update({
          where: {
            sessionId_userId: {
              sessionId: id,
              userId: candidateId
            }
          },
          data: {
            matricule: matricule || null
          }
        })

        console.log('Matricule mis à jour pour candidat:', candidateId, 'nouveau matricule:', matricule)
        return NextResponse.json(updatedCandidate)
      }

      if (candidateStatus) {
        // Vérifier que le statut est valide
        const validCandidateStatuses = [
          'REGISTERED', 'VALIDATED', 'IN_INTERVIEW', 'INTERVIEWED', 
          'QUIZ_READY', 'QUIZ_COMPLETED', 'PASSED', 'FAILED',
          'FAVORABLE', 'A_SURVEILLER', 'DEFAVORABLE'
        ]
        
        if (!validCandidateStatuses.includes(candidateStatus)) {
          return NextResponse.json({ error: 'Statut de candidat invalide' }, { status: 400 })
        }

        // Mettre à jour le statut du candidat
        const updatedCandidate = await prisma.sessionCandidate.update({
          where: {
            sessionId_userId: {
              sessionId: id,
              userId: candidateId
            }
          },
          data: {
            status: candidateStatus
          }
        })

        console.log('Candidat mis à jour:', candidateId, 'nouveau statut:', candidateStatus)
        return NextResponse.json(updatedCandidate)
      }
    }

    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Supprimer les candidats de la session
    await prisma.sessionCandidate.deleteMany({
      where: { sessionId: id }
    })
    
    // Supprimer les tentatives de quiz pour cette session
    await prisma.quizAttempt.deleteMany({
      where: { sessionId: id }
    })
    
    // Supprimer les quiz de session
    await prisma.sessionQuiz.deleteMany({
      where: { sessionId: id }
    })
    
    // Supprimer la session
    await prisma.session.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Session supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de la session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
