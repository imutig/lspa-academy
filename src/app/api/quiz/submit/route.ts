import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Soumettre un quiz
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'CANDIDAT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { quizId, answers, timeSpent, sessionId } = body

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID requis' }, { status: 400 })
    }

    // Vérifier que le candidat est inscrit à la session
    if (sessionId) {
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
          error: 'Vous devez terminer votre entretien avant de passer le quiz',
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

    // Récupérer le quiz avec les questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    // Vérifier si le candidat a déjà passé ce quiz
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId: session.user.id,
        completed: true
      }
    })

    if (existingAttempt) {
      return NextResponse.json({ error: 'Vous avez déjà passé ce quiz' }, { status: 400 })
    }

    // Calculer le score
    let totalPoints = 0
    let earnedPoints = 0

    const results = quiz.questions.map((question: any) => {
      const userAnswerIndexRaw = answers[question.id]
      // Convertir en number si c'est une string
      const userAnswerIndex = typeof userAnswerIndexRaw === 'string' ? parseInt(userAnswerIndexRaw, 10) : userAnswerIndexRaw
      const correctAnswer = question.correctAnswer
      
      // Parse les options pour trouver le texte de la réponse utilisateur
      const options = JSON.parse(question.options)
      
      let isCorrect = false
      
      if (userAnswerIndex !== null && userAnswerIndex !== undefined && !isNaN(userAnswerIndex) && options[userAnswerIndex]) {
        // L'utilisateur envoie l'index (0, 1, 2, 3)
        // La correctAnswer est stockée comme le texte de la bonne réponse
        const userAnswerText = options[userAnswerIndex].text
        isCorrect = userAnswerText === correctAnswer
      }
      
      totalPoints += question.points
      if (isCorrect) {
        earnedPoints += question.points
      }

      return {
        questionId: question.id,
        userAnswer: userAnswerIndex !== null && userAnswerIndex !== undefined && !isNaN(userAnswerIndex) ? options[userAnswerIndex]?.text : null,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0
      }
    })

    const scorePercentage = Math.round((earnedPoints / totalPoints) * 100)

    // Trouver ou créer une session pour ce candidat
    let candidateSession = await prisma.session.findFirst({
      where: {
        status: 'PLANNED' // ou toute autre logique pour trouver la session appropriée
      }
    })

    if (!candidateSession) {
      // Créer une session par défaut si aucune n'existe
      candidateSession = await prisma.session.create({
        data: {
          name: `Session Quiz ${new Date().toLocaleDateString()}`,
          description: 'Session automatique pour quiz',
          status: 'PLANNED',
          createdBy: session.user.id
        }
      })
    }

    // Sauvegarder la tentative
    const attempt = await prisma.quizAttempt.upsert({
      where: {
        quizId_userId: {
          quizId,
          userId: session.user.id
        }
      },
      update: {
        answers: answers,
        score: earnedPoints,
        maxScore: totalPoints,
        completed: true,
        completedAt: new Date()
      },
      create: {
        quizId,
        userId: session.user.id,
        sessionId: candidateSession.id,
        answers: answers,
        score: earnedPoints,
        maxScore: totalPoints,
        completed: true,
        completedAt: new Date()
      },
      include: {
        quiz: {
          select: {
            title: true,
            passingScoreNormal: true,
            passingScoreToWatch: true
          }
        }
      }
    })

    return NextResponse.json({
      attempt,
      results,
      summary: {
        totalQuestions: quiz.questions.length,
        correctAnswers: results.filter((r: any) => r.isCorrect).length,
        score: earnedPoints,
        maxScore: totalPoints,
        scorePercentage,
        passed: scorePercentage >= (quiz.passingScoreNormal || 80)
      },
      // Pour l'affichage dans l'interface candidate (sans révéler le vrai score)
      correctAnswers: results.filter((r: any) => r.isCorrect).length,
      timeSpent,
      passed: scorePercentage >= (quiz.passingScoreNormal || 80)
    })
  } catch (error) {
    console.error('Erreur lors de la soumission du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET - Récupérer les tentatives de quiz
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')
    const candidateId = searchParams.get('candidateId')

    let whereClause: any = {}

    if (session.user.role === 'CANDIDAT') {
      whereClause.userId = session.user.id
    } else {
      if (candidateId) {
        whereClause.userId = candidateId
      }
    }

    if (quizId) {
      whereClause.quizId = quizId
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: whereClause,
      include: {
        quiz: {
          select: {
            title: true,
            description: true,
            passingScoreNormal: true,
            passingScoreToWatch: true
          }
        },
        user: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error('Erreur lors de la récupération des tentatives:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
