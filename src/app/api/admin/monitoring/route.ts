import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtenir le statut en temps réel des quiz pour tous les candidats d'une session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID requis' }, { status: 400 })
    }

    // Récupérer tous les candidats de la session avec leurs tentatives de quiz
    const candidates = await prisma.sessionCandidate.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            quizAttempts: {
              where: { sessionId },
              include: {
                quiz: {
                  select: {
                    id: true,
                    title: true,
                    timeLimit: true
                  }
                }
              },
              orderBy: {
                startedAt: 'desc'
              }
            }
          }
        }
      },
      orderBy: {
        matricule: 'asc'
      }
    })

    // Récupérer les entretiens avec les informations de l'instructeur
    const interviews = await prisma.interview.findMany({
      where: { sessionId },
      include: {
        interviewer: {
          select: {
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    })

    // Formater les données pour le monitoring en temps réel
    const monitoring = candidates.map(candidate => {
      const quizAttempts = candidate.user.quizAttempts
      const interview = interviews.find(i => i.candidateId === candidate.user.id)
      
      const activeQuiz = quizAttempts.find(attempt => 
        !attempt.completed && 
        attempt.startedAt && 
        new Date(attempt.startedAt.getTime() + (attempt.quiz.timeLimit * 1000)) > new Date()
      )

      return {
        candidateId: candidate.user.id,
        matricule: candidate.matricule,
        fullName: `${candidate.user.firstName} ${candidate.user.lastName}`,
        username: candidate.user.username,
        status: candidate.status,
        interviewStatus: interview ? {
          inProgress: !!interview.interviewerId && !interview.completedAt,
          completed: !!interview.completedAt,
          interviewer: interview.interviewer ? 
            `${interview.interviewer.firstName} ${interview.interviewer.lastName}` : null,
          decision: interview.decision
        } : null,
        activeQuiz: activeQuiz ? {
          quizId: activeQuiz.quizId,
          quizTitle: activeQuiz.quiz.title,
          startedAt: activeQuiz.startedAt,
          timeRemaining: Math.max(0, Math.floor(
            (activeQuiz.startedAt.getTime() + (activeQuiz.quiz.timeLimit * 1000) - Date.now()) / 1000
          )),
          currentScore: activeQuiz.score || 0,
          questionsAnswered: activeQuiz.answers ? Object.keys(activeQuiz.answers).length : 0,
          lastActivity: activeQuiz.startedAt
        } : null,
        lastQuizAttempt: quizAttempts[0] ? {
          quizTitle: quizAttempts[0].quiz.title,
          completed: quizAttempts[0].completed,
          score: quizAttempts[0].score,
          completedAt: quizAttempts[0].completedAt,
          startedAt: quizAttempts[0].startedAt
        } : null,
        totalQuizAttempts: quizAttempts.length
      }
    })

    return NextResponse.json(monitoring)
  } catch (error) {
    console.error('Erreur lors de la récupération du monitoring:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
