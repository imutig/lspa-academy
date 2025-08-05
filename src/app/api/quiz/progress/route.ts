import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Sauvegarder le progrès d'un quiz
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'CANDIDAT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Gérer les deux types de requêtes : fetch et sendBeacon
    let body
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      body = await request.json()
    } else {
      // Pour sendBeacon, les données arrivent comme text
      const text = await request.text()
      try {
        body = JSON.parse(text)
      } catch {
        return NextResponse.json({ error: 'Format de données invalide' }, { status: 400 })
      }
    }

    const { quizId, currentQuestionIndex, answers, timeLeft, startTime, sessionId } = body

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID requis' }, { status: 400 })
    }

    // Si un sessionId est fourni, vérifier l'accès basé sur l'entretien
    let candidateSession
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

      candidateSession = sessionCandidate.session
    } else {
      // Trouver ou créer une session (mode legacy)
      candidateSession = await prisma.session.findFirst({
        where: {
          status: 'PLANNED'
        }
      })

      if (!candidateSession) {
        candidateSession = await prisma.session.create({
          data: {
            name: `Session Quiz ${new Date().toLocaleDateString()}`,
            description: 'Session automatique pour quiz',
            status: 'PLANNED',
            createdBy: session.user.id
          }
        })
      }
    }

    // Vérifier qu'il n'y a pas déjà une tentative complète
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId: session.user.id,
        completed: true
      }
    })

    if (existingAttempt) {
      return NextResponse.json({ error: 'Quiz déjà complété' }, { status: 400 })
    }

    // Trouver ou créer une tentative en cours
    let attempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId: session.user.id,
        completed: false
      }
    })

    const currentTime = Date.now()

    if (attempt) {
      // Mettre à jour la tentative existante
      attempt = await prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          answers: {
            ...attempt.answers as any,
            currentQuestionIndex,
            timeLeft,
            startTime,
            lastSaveTime: currentTime, // Ajouter le temps de dernière sauvegarde
            userAnswers: answers
          }
        }
      })
    } else {
      // Créer une nouvelle tentative ou mettre à jour si existe déjà
      // S'assurer que startTime est défini comme maintenant si pas fourni
      const actualStartTime = startTime || currentTime
      
      attempt = await prisma.quizAttempt.upsert({
        where: {
          quizId_userId: {
            quizId,
            userId: session.user.id
          }
        },
        create: {
          quizId,
          userId: session.user.id,
          sessionId: candidateSession.id,
          answers: {
            currentQuestionIndex,
            timeLeft,
            startTime: actualStartTime,
            lastSaveTime: currentTime,
            userAnswers: answers
          },
          score: 0,
          maxScore: 0,
          completed: false
        },
        update: {
          answers: {
            currentQuestionIndex,
            timeLeft,
            startTime: actualStartTime,
            lastSaveTime: currentTime,
            userAnswers: answers
          }
        }
      })
    }

    return NextResponse.json({ success: true, attemptId: attempt.id })
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du progrès:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET - Récupérer le progrès d'un quiz
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'CANDIDAT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID requis' }, { status: 400 })
    }

    // Chercher une tentative en cours
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId: session.user.id,
        completed: false
      }
    })

    if (!attempt) {
      return NextResponse.json({ hasProgress: false })
    }

    const progressData = attempt.answers as any
    const currentTime = Date.now()
    const lastSaveTime = progressData.lastSaveTime || progressData.startTime
    const timeElapsedSinceLastSave = Math.floor((currentTime - lastSaveTime) / 1000)
    const adjustedTimeLeft = Math.max(0, (progressData.timeLeft || 0) - timeElapsedSinceLastSave)
    
    return NextResponse.json({
      hasProgress: true,
      currentQuestionIndex: progressData.currentQuestionIndex || 0,
      answers: progressData.userAnswers || {},
      timeLeft: adjustedTimeLeft,
      originalTimeLeft: progressData.timeLeft, // Pour debug
      timeElapsedSinceLastSave,
      startTime: progressData.startTime,
      attemptId: attempt.id
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du progrès:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer le progrès d'un quiz (reset)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'CANDIDAT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID requis' }, { status: 400 })
    }

    // Supprimer les tentatives non complétées
    await prisma.quizAttempt.deleteMany({
      where: {
        quizId,
        userId: session.user.id,
        completed: false
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression du progrès:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
