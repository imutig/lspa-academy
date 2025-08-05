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
                    timeLimit: true,
                    questions: {
                      select: {
                        id: true,
                        options: true,
                        correctAnswer: true
                      }
                    }
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
      
      const activeQuiz = quizAttempts.find(attempt => {
        // Quiz actif = commencé mais pas terminé
        return !attempt.completed && attempt.startedAt
      })

      // Dernier quiz terminé seulement
      const lastCompletedQuiz = quizAttempts.find(attempt => attempt.completed)

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
          timeRemaining: (() => {
            // Utiliser le startTime sauvegardé dans answers s'il existe, sinon startedAt
            const answers = activeQuiz.answers as any
            const actualStartTime = answers?.startTime ? new Date(answers.startTime) : activeQuiz.startedAt
            const elapsedTime = Date.now() - actualStartTime.getTime()
            const totalTimeMs = activeQuiz.quiz.timeLimit * 1000
            const remainingMs = Math.max(0, totalTimeMs - elapsedTime)
            return Math.floor(remainingMs / 1000)
          })(),
          currentScore: (() => {
            // Calculer le score en temps réel basé sur les réponses actuelles
            const answers = activeQuiz.answers as any
            if (!answers) return 0
            
            // Pour les quiz en cours, les réponses sont dans answers.userAnswers
            // Pour les quiz terminés, les réponses sont directement dans answers
            const userAnswers = answers.userAnswers || answers
            if (!userAnswers || Object.keys(userAnswers).length === 0) return 0
            
            let correctAnswers = 0
            let totalAnswered = 0
            
            // Parcourir les questions du quiz
            activeQuiz.quiz.questions.forEach((question: any) => {
              const userAnswerIndex = userAnswers[question.id]
              
              if (userAnswerIndex !== undefined && userAnswerIndex !== null) {
                totalAnswered++
                
                // Convertir en number si c'est une string
                const userAnswerIndexNum = typeof userAnswerIndex === 'string' ? parseInt(userAnswerIndex, 10) : userAnswerIndex
                
                if (!isNaN(userAnswerIndexNum)) {
                  // Parse les options pour trouver le texte de la réponse utilisateur
                  const options = JSON.parse(question.options)
                  if (options[userAnswerIndexNum]) {
                    const userAnswerText = options[userAnswerIndexNum].text
                    if (userAnswerText === question.correctAnswer) {
                      correctAnswers++
                    }
                  }
                }
              }
            })
            
            return correctAnswers
          })(),
          questionsAnswered: (() => {
            const answers = activeQuiz.answers as any
            if (!answers) return 0
            
            // Pour les quiz en cours, les réponses sont dans answers.userAnswers
            const userAnswers = answers.userAnswers || answers
            if (!userAnswers) return 0
            
            // Compter seulement les vraies réponses (pas les métadonnées)
            const realAnswers = Object.keys(userAnswers).filter(key => 
              key !== 'startTime' && 
              key !== 'currentQuestionIndex' && 
              key !== 'timeLeft' && 
              key !== 'lastSaveTime'
            )
            return realAnswers.length
          })(),
          lastActivity: activeQuiz.startedAt
        } : null,
        lastQuizAttempt: lastCompletedQuiz ? {
          quizTitle: lastCompletedQuiz.quiz.title,
          completed: lastCompletedQuiz.completed,
          score: lastCompletedQuiz.score,
          correctAnswersPercentage: (() => {
            const answers = lastCompletedQuiz.answers as any
            const totalQuestions = lastCompletedQuiz.quiz.questions.length
            if (!answers || totalQuestions === 0) return 0
            
            let correctCount = 0
            
            // Parcourir les questions du quiz pour calculer le score
            lastCompletedQuiz.quiz.questions.forEach((question: any) => {
              const userAnswerIndex = answers[question.id]
              
              if (userAnswerIndex !== undefined && userAnswerIndex !== null) {
                // Convertir en number si c'est une string
                const userAnswerIndexNum = typeof userAnswerIndex === 'string' ? parseInt(userAnswerIndex, 10) : userAnswerIndex
                
                if (!isNaN(userAnswerIndexNum)) {
                  // Parse les options pour trouver le texte de la réponse utilisateur
                  const options = JSON.parse(question.options)
                  if (options[userAnswerIndexNum]) {
                    const userAnswerText = options[userAnswerIndexNum].text
                    if (userAnswerText === question.correctAnswer) {
                      correctCount++
                    }
                  }
                }
              }
            })
            
            return Math.round((correctCount / totalQuestions) * 100)
          })(),
          completedAt: lastCompletedQuiz.completedAt,
          startedAt: lastCompletedQuiz.startedAt
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
