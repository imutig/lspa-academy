import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les quiz
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('id')
    const sessionId = searchParams.get('sessionId')
    const includeQuestions = searchParams.get('includeQuestions') === 'true'

    if (quizId) {
      // Pour les candidats, vérifier l'accès au quiz basé sur l'entretien
      if (session.user.role === 'CANDIDAT' && sessionId) {
        const sessionCandidate = await prisma.sessionCandidate.findUnique({
          where: {
            sessionId_userId: {
              sessionId,
              userId: session.user.id
            }
          },
          include: {
            session: {
              include: {
                interviews: {
                  where: { candidateId: session.user.id }
                }
              }
            }
          }
        })

        if (!sessionCandidate) {
          return NextResponse.json({ error: 'Vous n\'êtes pas inscrit à cette session' }, { status: 403 })
        }

        // Vérifier que l'entretien est terminé
        const interview = sessionCandidate.session.interviews[0]
        if (!interview || interview.status !== 'COMPLETED') {
          return NextResponse.json({ 
            error: 'Vous devez terminer votre entretien avant d\'accéder au quiz',
            code: 'INTERVIEW_NOT_COMPLETED'
          }, { status: 403 })
        }

        // Vérifier que la décision d'entretien n'est pas défavorable
        if (interview.decision === 'DEFAVORABLE') {
          return NextResponse.json({ 
            error: 'Accès au quiz refusé suite à la décision d\'entretien',
            code: 'INTERVIEW_UNFAVORABLE'
          }, { status: 403 })
        }
      }

      // Récupérer un quiz spécifique
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: includeQuestions,
          attempts: session.user.role === 'CANDIDAT' ? {
            where: { userId: session.user.id },
            orderBy: { startedAt: 'desc' },
            take: 1
          } : {
            include: {
              user: {
                select: { username: true, email: true }
              }
            },
            orderBy: { startedAt: 'desc' }
          }
        }
      })

      if (!quiz) {
        return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
      }

      // Parse options JSON strings back to arrays for questions
      if (includeQuestions && quiz.questions) {
        (quiz as any).questions = quiz.questions.map(question => {
          let parsedOptions = []
          
          if (question.options) {
            try {
              const optionsData = JSON.parse(question.options)
              
              // Handle both old format (objects with text/isCorrect) and new format (simple strings)
              if (Array.isArray(optionsData)) {
                parsedOptions = optionsData.map(option => {
                  if (typeof option === 'string') {
                    return option
                  } else if (option && typeof option === 'object' && option.text) {
                    return option.text
                  }
                  return String(option)
                })
              }
            } catch (error) {
              console.error('Error parsing options for question:', question.id, error)
              parsedOptions = []
            }
          }
          
          return {
            ...question,
            options: parsedOptions
          }
        })
      }

      return NextResponse.json(quiz)
    } else {
      // Récupérer tous les quiz
      const quizzes = await prisma.quiz.findMany({
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
              sessionQuizzes: true
            }
          },
          sessionQuizzes: {
            include: {
              session: {
                select: { name: true }
              }
            }
          },
          attempts: session.user.role === 'CANDIDAT' ? {
            where: { userId: session.user.id },
            orderBy: { startedAt: 'desc' },
            take: 1
          } : false
        },
        orderBy: { createdAt: 'desc' }
      })

      // Pour les candidats, transformer les données pour inclure le pourcentage correct
      if (session.user.role === 'CANDIDAT') {
        const transformedQuizzes = quizzes.map(quiz => {
          const attempt = (quiz.attempts as any[])?.[0]
          return {
            ...quiz,
            hasAttempt: !!attempt,
            attemptScore: attempt ? Math.round((attempt.score / attempt.maxScore) * 100) : 0,
            attemptPassed: attempt ? (attempt.score / attempt.maxScore) * 100 >= quiz.passingScoreNormal : false
          }
        })
        return NextResponse.json(transformedQuizzes)
      }

      return NextResponse.json(quizzes)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouveau quiz (superviseurs+)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, timeLimit, passingScoreNormal, passingScoreToWatch, questions } = body

    // Validation
    if (!title) {
      return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        timeLimit: timeLimit ? parseInt(timeLimit) : 600,
        passingScoreNormal: passingScoreNormal ? parseInt(passingScoreNormal) : 80,
        passingScoreToWatch: passingScoreToWatch ? parseInt(passingScoreToWatch) : 90,
        questions: questions ? {
          create: questions.map((q: any, index: number) => ({
            question: q.question,
            options: JSON.stringify(q.options), // Convert array to JSON string
            correctAnswer: q.correctAnswer.toString(), // Ensure it's a string
            points: q.points || 1,
            order: index + 1
          }))
        } : undefined
      },
      include: {
        _count: {
          select: { questions: true, attempts: true }
        }
      }
    })

    return NextResponse.json(quiz, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un quiz
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('id')
    
    if (!quizId) {
      return NextResponse.json({ error: 'ID du quiz requis' }, { status: 400 })
    }

    const body = await request.json()
    const { title, description, timeLimit, passingScoreNormal, passingScoreToWatch, questions } = body

    // Supprimer toutes les questions existantes du quiz
    await prisma.question.deleteMany({
      where: { quizId }
    })

    // Mettre à jour le quiz avec les nouvelles données
    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        title,
        description,
        timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
        passingScoreNormal: passingScoreNormal ? parseInt(passingScoreNormal) : undefined,
        passingScoreToWatch: passingScoreToWatch ? parseInt(passingScoreToWatch) : undefined,
        questions: questions ? {
          create: questions.map((q: any, index: number) => ({
            question: q.question,
            options: JSON.stringify(q.options), // Convert array to JSON string
            correctAnswer: q.correctAnswer.toString(), // Ensure it's a string
            points: q.points || 1,
            order: index + 1
          }))
        } : undefined
      },
      include: {
        questions: true,
        _count: {
          select: { questions: true, attempts: true }
        }
      }
    })

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un quiz
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('id')

    if (!quizId) {
      return NextResponse.json({ error: 'ID du quiz requis' }, { status: 400 })
    }

    // Vérifier si le quiz existe
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        _count: {
          select: {
            attempts: true,
            sessionQuizzes: true
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    // Vérifier s'il y a des tentatives ou des sessions liées
    if (quiz._count.attempts > 0) {
      return NextResponse.json({ 
        error: 'Impossible de supprimer un quiz avec des tentatives existantes. Utilisez la fonction de remise à zéro à la place.' 
      }, { status: 400 })
    }

    if (quiz._count.sessionQuizzes > 0) {
      return NextResponse.json({ 
        error: 'Impossible de supprimer un quiz lié à des sessions. Retirez-le d\'abord des sessions.' 
      }, { status: 400 })
    }

    // Supprimer les questions en premier (cascade)
    await prisma.question.deleteMany({
      where: { quizId }
    })

    // Supprimer le quiz
    await prisma.quiz.delete({
      where: { id: quizId }
    })

    return NextResponse.json({ 
      message: 'Quiz supprimé avec succès',
      deletedQuizId: quizId 
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
