import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Mettre à jour un quiz dans une session (activation/désactivation)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id: sessionId, quizId } = await params
    const body = await request.json()
    const { isActive } = body

    // Le quizId peut être soit l'ID du quiz, soit l'ID de la relation SessionQuiz
    let sessionQuiz

    // D'abord, essayons de trouver par sessionQuizId (si quizId est en fait un sessionQuizId)
    try {
      sessionQuiz = await prisma.sessionQuiz.findUnique({
        where: { id: quizId },
        include: {
          quiz: {
            include: {
              _count: {
                select: { questions: true, attempts: true }
              }
            }
          }
        }
      })
    } catch (error) {
      // Si ça échoue, essayons avec la combinaison sessionId + quizId
    }

    if (!sessionQuiz) {
      // Essayer avec la combinaison sessionId + quizId
      sessionQuiz = await prisma.sessionQuiz.findUnique({
        where: {
          sessionId_quizId: {
            sessionId,
            quizId
          }
        },
        include: {
          quiz: {
            include: {
              _count: {
                select: { questions: true, attempts: true }
              }
            }
          }
        }
      })
    }

    if (!sessionQuiz) {
      return NextResponse.json({ error: 'Quiz non affecté à cette session' }, { status: 404 })
    }

    const updatedSessionQuiz = await prisma.sessionQuiz.update({
      where: { id: sessionQuiz.id },
      data: {
        ...(isActive !== undefined && { isActive })
      },
      include: {
        quiz: {
          include: {
            _count: {
              select: { questions: true, attempts: true }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedSessionQuiz)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Désaffecter un quiz d'une session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id: sessionId, quizId } = await params

    // Le quizId peut être soit l'ID du quiz, soit l'ID de la relation SessionQuiz
    let sessionQuiz

    // D'abord, essayons de trouver par sessionQuizId
    try {
      sessionQuiz = await prisma.sessionQuiz.findUnique({
        where: { id: quizId }
      })
    } catch (error) {
      // Si ça échoue, essayons avec la combinaison sessionId + quizId
    }

    if (!sessionQuiz) {
      // Essayer avec la combinaison sessionId + quizId
      sessionQuiz = await prisma.sessionQuiz.findUnique({
        where: {
          sessionId_quizId: {
            sessionId,
            quizId
          }
        }
      })
    }

    if (!sessionQuiz) {
      return NextResponse.json({ error: 'Quiz non affecté à cette session' }, { status: 404 })
    }

    // Vérifier s'il y a des tentatives pour ce quiz dans cette session
    const attemptCount = await prisma.quizAttempt.count({
      where: { 
        quizId: sessionQuiz.quizId,
        sessionId: sessionQuiz.sessionId 
      }
    })

    if (attemptCount > 0) {
      return NextResponse.json({ 
        error: 'Impossible de désaffecter un quiz qui a des tentatives dans cette session' 
      }, { status: 400 })
    }

    await prisma.sessionQuiz.delete({
      where: { id: sessionQuiz.id }
    })

    return NextResponse.json({ message: 'Quiz désaffecté avec succès' })
  } catch (error) {
    console.error('Erreur lors de la désaffectation du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
