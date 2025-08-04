import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les interviews
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')
    const sessionId = searchParams.get('sessionId')
    const status = searchParams.get('status')

    let whereClause: any = {}

    // Si c'est un candidat, il ne peut voir que ses propres interviews
    if (session.user.role === 'CANDIDAT') {
      whereClause.candidateId = session.user.id
    } else if (candidateId) {
      whereClause.candidateId = candidateId
    }

    if (sessionId) {
      whereClause.sessionId = sessionId
    }

    if (status) {
      whereClause.status = status
    }

    const interviews = await prisma.interview.findMany({
      where: whereClause,
      include: {
        candidate: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        interviewer: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        session: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(interviews)
  } catch (error) {
    console.error('Erreur lors de la récupération des interviews:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle interview
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    
    // Nouveau système d'entretien avec session
    if (body.sessionId && body.candidateId && body.interviewerId) {
      const { sessionId, candidateId, interviewerId, decision, notes } = body

      // Vérifier si un entretien existe déjà pour ce candidat dans cette session
      const existingInterview = await prisma.interview.findFirst({
        where: {
          sessionId,
          candidateId
        }
      })

      if (existingInterview) {
        // Si une décision est fournie, mettre à jour l'entretien existant
        if (decision !== undefined) {
          const updatedInterview = await prisma.interview.update({
            where: { id: existingInterview.id },
            data: {
              interviewerId,
              decision,
              notes: notes || existingInterview.notes,
              updatedAt: new Date()
            },
            include: {
              candidate: {
                select: {
                  username: true
                }
              },
              interviewer: {
                select: {
                  username: true
                }
              }
            }
          })

          // Mettre à jour le statut du candidat seulement si une décision est prise
          if (decision) {
            const newStatus = decision === 'FAVORABLE' ? 'PASSED' : 
                             decision === 'DEFAVORABLE' ? 'FAILED' : 
                             'INTERVIEWED'
                             
            await prisma.sessionCandidate.update({
              where: {
                sessionId_userId: {
                  sessionId,
                  userId: candidateId
                }
              },
              data: {
                status: newStatus
              }
            })
          }

          return NextResponse.json(updatedInterview)
        } else {
          // Juste mettre à jour les notes si pas de décision
          const updatedInterview = await prisma.interview.update({
            where: { id: existingInterview.id },
            data: {
              notes: notes || existingInterview.notes,
              updatedAt: new Date()
            },
            include: {
              candidate: {
                select: {
                  username: true
                }
              },
              interviewer: {
                select: {
                  username: true
                }
              }
            }
          })
          
          return NextResponse.json(updatedInterview)
        }
      } else {
        // Créer un nouvel entretien
        const newInterview = await prisma.interview.create({
          data: {
            sessionId,
            candidateId,
            interviewerId,
            decision: decision || null,
            notes: notes || ''
          },
          include: {
            candidate: {
              select: {
                username: true
              }
            },
            interviewer: {
              select: {
                username: true
              }
            }
          }
        })

        // Mettre à jour le statut du candidat à "IN_INTERVIEW" quand l'entretien commence
        await prisma.sessionCandidate.update({
          where: {
            sessionId_userId: {
              sessionId,
              userId: candidateId
            }
          },
          data: {
            status: 'IN_INTERVIEW'
          }
        })

        return NextResponse.json(newInterview)
      }
    }

    // Ancien système d'entretien
    const { candidateId, scheduledAt, type, notes } = body

    // Vérifier que le candidat existe
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId, role: 'CANDIDAT' }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidat non trouvé' }, { status: 404 })
    }

    // Créer l'interview
    const interview = await prisma.interview.create({
      data: {
        candidateId,
        interviewerId: session.user.id,
        scheduledAt: new Date(scheduledAt),
        type: type || 'ORAL',
        status: 'SCHEDULED',
        notes: notes || ''
      },
      include: {
        candidate: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        interviewer: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(interview, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de l\'interview:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour une interview
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, notes, decision, score } = body

    const interview = await prisma.interview.update({
      where: { id },
      data: {
        status,
        notes,
        decision,
        score: score ? parseInt(score) : null,
        completedAt: status === 'COMPLETED' ? new Date() : null
      },
      include: {
        candidate: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        interviewer: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(interview)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'interview:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une interview
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const candidateId = searchParams.get('candidateId')
    const interviewId = searchParams.get('id')

    if (interviewId) {
      // Supprimer par ID
      await prisma.interview.delete({
        where: { id: interviewId }
      })
    } else if (sessionId && candidateId) {
      // Supprimer l'entretien en cours pour ce candidat dans cette session
      const interview = await prisma.interview.findFirst({
        where: {
          sessionId,
          candidateId,
          decision: null // Seulement les entretiens en cours
        }
      })

      if (interview) {
        await prisma.interview.delete({
          where: { id: interview.id }
        })
      }
    } else {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Interview supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'interview:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
