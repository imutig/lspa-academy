import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Vérifier si un candidat peut accéder aux quiz
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id: sessionId, candidateId } = await params

    // Vérifier l'interview du candidat
    const interview = await prisma.interview.findFirst({
      where: {
        sessionId,
        candidateId
      }
    })

    const canAccessQuiz = interview && 
                         interview.status === 'COMPLETED' && 
                         (interview.decision === 'FAVORABLE' || interview.decision === 'A_SURVEILLER')

    return NextResponse.json({ 
      canAccessQuiz,
      interviewStatus: interview?.status,
      interviewDecision: interview?.decision,
      message: canAccessQuiz 
        ? 'Accès autorisé aux quiz'
        : !interview 
          ? 'Entretien non planifié'
          : interview.status !== 'COMPLETED'
            ? 'Entretien non terminé'
            : interview.decision === 'DEFAVORABLE'
              ? 'Candidat défavorable - accès refusé'
              : 'Statut non compatible'
    })
  } catch (error) {
    console.error('Erreur lors de la vérification d\'accès quiz:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
}

// POST - Démarrer une tentative de quiz avec vérification des prérequis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id: sessionId, candidateId } = await params
    const { quizId } = await request.json()

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID requis' }, { status: 400 })
    }

    // Vérifier les prérequis
    const interview = await prisma.interview.findFirst({
      where: {
        sessionId,
        candidateId
      }
    })

    const canAccessQuiz = interview && 
                         interview.status === 'COMPLETED' && 
                         (interview.decision === 'FAVORABLE' || interview.decision === 'A_SURVEILLER')

    if (!canAccessQuiz) {
      return NextResponse.json({ 
        error: 'Accès refusé', 
        message: !interview 
          ? 'Entretien non planifié'
          : interview.status !== 'COMPLETED'
            ? 'Entretien non terminé'
            : interview.decision === 'DEFAVORABLE'
              ? 'Candidat défavorable - accès refusé'
              : 'Statut non compatible'
      }, { status: 403 })
    }

    // Vérifier si une tentative existe déjà
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId: candidateId,
        sessionId
      }
    })

    if (existingAttempt && existingAttempt.completed) {
      return NextResponse.json({ 
        error: 'Quiz déjà terminé',
        attempt: existingAttempt
      }, { status: 400 })
    }

    // Récupérer les informations du quiz et les scores requis
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        timeLimit: true,
        passingScoreNormal: true,
        passingScoreToWatch: true
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    // Déterminer le score de passage selon la décision d'entretien
    const requiredScore = interview.decision === 'A_SURVEILLER' 
      ? quiz.passingScoreToWatch 
      : quiz.passingScoreNormal

    if (existingAttempt && !existingAttempt.completed) {
      // Retourner la tentative en cours
      return NextResponse.json({
        attempt: existingAttempt,
        quiz,
        requiredScore,
        interviewDecision: interview.decision
      })
    }

    // Créer une nouvelle tentative
    const newAttempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: candidateId,
        sessionId,
        answers: {},
        score: 0,
        maxScore: 0, // Sera mis à jour avec le nombre de questions
        completed: false
      }
    })

    // Mettre à jour le statut du candidat
    await prisma.sessionCandidate.updateMany({
      where: {
        sessionId,
        userId: candidateId
      },
      data: {
        status: 'QUIZ_READY'
      }
    })

    return NextResponse.json({
      attempt: newAttempt,
      quiz,
      requiredScore,
      interviewDecision: interview.decision,
      message: `Quiz démarré. Score requis: ${requiredScore}% (candidat ${interview.decision === 'A_SURVEILLER' ? 'à surveiller' : 'favorable'})`
    })
  } catch (error) {
    console.error('Erreur lors du démarrage du quiz:', error)
    return NextResponse.json(
      { error: 'Erreur lors du démarrage du quiz' },
      { status: 500 }
    )
  }
}
