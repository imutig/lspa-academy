import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['DIRECTEUR', 'SUPERVISEUR'].includes((session.user as any)?.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { isActive } = await request.json()
    const codeId = params.id

    const updatedCode = await prisma.registrationCode.update({
      where: { id: codeId },
      data: { isActive }
    })

    return NextResponse.json(updatedCode)

  } catch (error) {
    console.error('Erreur lors de la mise à jour du code:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['DIRECTEUR', 'SUPERVISEUR'].includes((session.user as any)?.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const codeId = params.id

    await prisma.registrationCode.delete({
      where: { id: codeId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur lors de la suppression du code:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
