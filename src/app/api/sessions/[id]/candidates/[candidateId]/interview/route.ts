import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
    candidateId: string
  }>
}

// GET - Récupérer un entretien existant
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, candidateId } = await params
    
    const interview = await prisma.interview.findFirst({
      where: {
        candidateId: candidateId,
        sessionId: id
      },
      include: {
        interviewQuestions: {
          include: {
            question: true
          }
        },
        interviewSituations: {
          include: {
            situation: true
          }
        }
      }
    })

    if (!interview) {
      return NextResponse.json({ error: 'Entretien non trouvé' }, { status: 404 })
    }

    // Formater les données pour l'affichage
    const reportData = {
      id: interview.id,
      status: interview.status,
      conductedBy: interview.conductedBy,
      completedAt: interview.completedAt,
      finalDecision: interview.decision,
      additionalNotes: interview.notes,
      questions: interview.interviewQuestions.map((iq: any) => ({
        question: iq.question.question,
        answer: iq.answer,
        rating: iq.rating
      })),
      situations: interview.interviewSituations.map((is: any) => ({
        title: is.situation.title,
        description: is.situation.description,
        expectedResponse: is.situation.expectedResponse,
        candidateResponse: is.candidateResponse,
        evaluation: is.evaluation
      }))
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'entretien:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'entretien' },
      { status: 500 }
    )
  }
}

// POST - Créer ou mettre à jour un entretien
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, candidateId } = await params
    const body = await request.json()
    const { questions, situations, additionalNotes, finalDecision, conductedBy, status } = body

    // Obtenir la session utilisateur pour l'interviewer
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier si un entretien existe déjà
    const existingInterview = await prisma.interview.findFirst({
      where: {
        candidateId: candidateId,
        sessionId: id
      }
    })

    let interview

    if (existingInterview) {
      // Mettre à jour l'entretien existant
      const updateData: any = {
        interviewerId: session.user.id,
        conductedBy: conductedBy || `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || session.user.username
      }

      // Si c'est juste une prise en charge (status IN_PROGRESS)
      if (status === 'IN_PROGRESS') {
        updateData.status = 'IN_PROGRESS'
      } else {
        // Si c'est une finalisation complète
        updateData.status = 'COMPLETED'
        updateData.decision = finalDecision
        updateData.notes = additionalNotes
        updateData.completedAt = new Date()
      }

      interview = await prisma.interview.update({
        where: { id: existingInterview.id },
        data: updateData
      })

      // Supprimer les anciennes réponses seulement si on finalise
      if (status !== 'IN_PROGRESS') {
        await prisma.interviewQuestion.deleteMany({
          where: { interviewId: interview.id }
        })
        await prisma.interviewSituation.deleteMany({
          where: { interviewId: interview.id }
        })
      }
    } else {
      // Créer un nouvel entretien
      const createData: any = {
        candidateId: candidateId,
        sessionId: id,
        interviewerId: session.user.id,
        conductedBy: conductedBy || `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || session.user.username
      }

      if (status === 'IN_PROGRESS') {
        createData.status = 'IN_PROGRESS'
      } else {
        createData.status = 'COMPLETED'
        createData.decision = finalDecision
        createData.notes = additionalNotes
        createData.completedAt = new Date()
      }

      interview = await prisma.interview.create({
        data: createData
      })
    }

    // Ajouter les questions et réponses seulement si on finalise
    if (status !== 'IN_PROGRESS' && questions && questions.length > 0) {
      for (const q of questions) {
        await prisma.interviewQuestion.create({
          data: {
            interviewId: interview.id,
            questionId: q.questionId,
            answer: q.answer,
            rating: q.rating
          }
        })
      }
    }

    // Ajouter les situations et réponses seulement si on finalise
    if (status !== 'IN_PROGRESS' && situations && situations.length > 0) {
      for (const s of situations) {
        await prisma.interviewSituation.create({
          data: {
            interviewId: interview.id,
            situationId: s.situationId,
            candidateResponse: s.candidateResponse,
            evaluation: s.evaluation
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      interview: {
        id: interview.id,
        status: interview.status,
        decision: interview.decision
      }
    })
  } catch (error) {
    console.error('Erreur lors de la soumission de l\'entretien:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la soumission de l\'entretien' },
      { status: 500 }
    )
  }
}

// DELETE - Désaffecter un entretien
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, candidateId } = await params
    
    const interview = await prisma.interview.findFirst({
      where: {
        candidateId: candidateId,
        sessionId: id
      }
    })

    if (!interview) {
      return NextResponse.json({ error: 'Entretien non trouvé' }, { status: 404 })
    }

    // Supprimer les réponses associées
    await prisma.interviewQuestion.deleteMany({
      where: { interviewId: interview.id }
    })
    await prisma.interviewSituation.deleteMany({
      where: { interviewId: interview.id }
    })

    // Supprimer l'entretien
    await prisma.interview.delete({
      where: { id: interview.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la désaffectation de l\'entretien:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la désaffectation de l\'entretien' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour une décision d'entretien
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id, candidateId } = await params
    const { decision } = await request.json()

    if (!decision || !['FAVORABLE', 'DEFAVORABLE', 'A_SURVEILLER'].includes(decision)) {
      return NextResponse.json({ error: 'Décision invalide' }, { status: 400 })
    }

    // Trouver l'entretien existant
    const interview = await prisma.interview.findFirst({
      where: {
        sessionId: id,
        candidateId: candidateId
      }
    })

    if (!interview) {
      return NextResponse.json({ error: 'Entretien non trouvé' }, { status: 404 })
    }

    // Mettre à jour la décision
    const updatedInterview = await prisma.interview.update({
      where: { id: interview.id },
      data: { decision }
    })

    // Mettre à jour le statut du candidat selon la décision
    let newStatus: 'QUIZ_READY' | 'FAILED'
    if (decision === 'FAVORABLE' || decision === 'A_SURVEILLER') {
      newStatus = 'QUIZ_READY'
    } else {
      newStatus = 'FAILED'
    }

    await prisma.sessionCandidate.updateMany({
      where: {
        sessionId: id,
        userId: candidateId
      },
      data: { status: newStatus }
    })

    return NextResponse.json(updatedInterview)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la décision:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la décision' },
      { status: 500 }
    )
  }
}
