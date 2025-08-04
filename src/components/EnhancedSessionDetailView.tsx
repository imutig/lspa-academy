'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { modernDesign } from '@/utils/modernDesign'

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  matricule?: string
  status: 'REGISTERED' | 'VALIDATED' | 'IN_INTERVIEW' | 'INTERVIEWED' | 'QUIZ_READY' | 'QUIZ_COMPLETED' | 'PASSED' | 'FAILED'
  registeredAt: string
  interview?: {
    id: string
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
    completedAt?: string
    conductedBy?: string
    decision?: 'FAVORABLE' | 'DEFAVORABLE' | 'A_SURVEILLER'
  }
  quizAttempts?: Array<{
    id: string
    score: number
    totalQuestions: number
    correctAnswers: number
    startedAt: string
    completedAt?: string
    isInProgress: boolean
  }>
}

interface EnhancedSessionDetailViewProps {
  sessionId: string
  candidates: Candidate[]
  onAssignMatricule: (candidateId: string, matricule: string) => void
  onUpdateDecision: (candidateId: string, decision: 'FAVORABLE' | 'DEFAVORABLE' | 'A_SURVEILLER') => void
  canConductInterview: boolean
  onStartInterview: (candidate: Candidate) => void
  onViewReport: (candidate: Candidate) => void
  onUnassignInterview: (candidate: Candidate) => void
}

export default function EnhancedSessionDetailView({
  sessionId,
  candidates,
  onAssignMatricule,
  onUpdateDecision,
  canConductInterview,
  onStartInterview,
  onViewReport,
  onUnassignInterview
}: EnhancedSessionDetailViewProps) {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')

  // Fonction pour trier les candidats par catégorie et matricule
  const getCategorizedCandidates = () => {
    const categorized = {
      waitingInterview: candidates.filter(c => 
        !c.interview || c.interview.status === 'SCHEDULED'
      ).sort((a, b) => {
        if (a.matricule && b.matricule) return a.matricule.localeCompare(b.matricule)
        if (a.matricule) return -1
        if (b.matricule) return 1
        return 0
      }),
      favorable: candidates.filter(c => 
        c.interview?.status === 'COMPLETED' && c.interview.decision === 'FAVORABLE'
      ).sort((a, b) => {
        if (a.quizAttempts?.length && b.quizAttempts?.length) {
          const aScore = Math.max(...a.quizAttempts.map(q => q.correctAnswers))
          const bScore = Math.max(...b.quizAttempts.map(q => q.correctAnswers))
          return bScore - aScore
        }
        if (a.matricule && b.matricule) return a.matricule.localeCompare(b.matricule)
        return 0
      }),
      toWatch: candidates.filter(c => 
        c.interview?.status === 'COMPLETED' && c.interview.decision === 'A_SURVEILLER'
      ).sort((a, b) => {
        if (a.quizAttempts?.length && b.quizAttempts?.length) {
          const aScore = Math.max(...a.quizAttempts.map(q => q.correctAnswers))
          const bScore = Math.max(...b.quizAttempts.map(q => q.correctAnswers))
          return bScore - aScore
        }
        if (a.matricule && b.matricule) return a.matricule.localeCompare(b.matricule)
        return 0
      }),
      unfavorable: candidates.filter(c => 
        c.interview?.status === 'COMPLETED' && c.interview.decision === 'DEFAVORABLE'
      ).sort((a, b) => {
        if (a.matricule && b.matricule) return a.matricule.localeCompare(b.matricule)
        return 0
      })
    }
    return categorized
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Barre de recherche */}
      <div style={{
        ...modernDesign.glass.card,
        padding: '20px'
      }}>
        <input
          type="text"
          placeholder="Rechercher un candidat (nom, email, matricule)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            ...modernDesign.inputs.modern,
            width: '100%',
            fontSize: '16px'
          }}
        />
      </div>

      {/* Liste des candidats par catégories */}
      {(() => {
        const categorized = getCategorizedCandidates()
        const allCandidates = [...categorized.waitingInterview, ...categorized.favorable, ...categorized.toWatch, ...categorized.unfavorable]
        const filteredCandidates = allCandidates.filter(candidate =>
          `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (candidate.matricule && candidate.matricule.toLowerCase().includes(searchTerm.toLowerCase()))
        )

        if (searchTerm) {
          // Mode recherche : afficher tous les candidats correspondants
          return (
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {filteredCandidates.map((candidate) => (
                <CandidateCard 
                  key={candidate.id} 
                  candidate={candidate} 
                  onAssignMatricule={onAssignMatricule}
                  onUpdateDecision={onUpdateDecision}
                  canConductInterview={canConductInterview}
                  onStartInterview={onStartInterview}
                  onViewReport={onViewReport}
                  onUnassignInterview={onUnassignInterview}
                  session={session}
                />
              ))}
              {filteredCandidates.length === 0 && (
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '48px',
                  textAlign: 'center'
                }}>
                  <p style={modernDesign.typography.body}>
                    Aucun candidat trouvé pour cette recherche
                  </p>
                </div>
              )}
            </div>
          )
        }

        // Mode normal : afficher par catégories
        return (
          <div style={{ display: 'grid', gap: '32px' }}>
            {/* En attente d'entretien */}
            <CategorySection 
              title="🕐 En attente d'entretien"
              candidates={categorized.waitingInterview}
              color="rgba(59, 130, 246, 0.1)"
              borderColor="rgba(59, 130, 246, 0.3)"
              onAssignMatricule={onAssignMatricule}
              onUpdateDecision={onUpdateDecision}
              canConductInterview={canConductInterview}
              onStartInterview={onStartInterview}
              onViewReport={onViewReport}
              onUnassignInterview={onUnassignInterview}
              session={session}
            />

            {/* Favorables */}
            <CategorySection 
              title="✅ Favorables"
              candidates={categorized.favorable}
              color="rgba(34, 197, 94, 0.1)"
              borderColor="rgba(34, 197, 94, 0.3)"
              onAssignMatricule={onAssignMatricule}
              onUpdateDecision={onUpdateDecision}
              canConductInterview={canConductInterview}
              onStartInterview={onStartInterview}
              onViewReport={onViewReport}
              onUnassignInterview={onUnassignInterview}
              session={session}
            />

            {/* À surveiller */}
            <CategorySection 
              title="⚠️ À surveiller"
              candidates={categorized.toWatch}
              color="rgba(245, 158, 11, 0.1)"
              borderColor="rgba(245, 158, 11, 0.3)"
              onAssignMatricule={onAssignMatricule}
              onUpdateDecision={onUpdateDecision}
              canConductInterview={canConductInterview}
              onStartInterview={onStartInterview}
              onViewReport={onViewReport}
              onUnassignInterview={onUnassignInterview}
              session={session}
            />

            {/* Défavorables */}
            <CategorySection 
              title="❌ Défavorables"
              candidates={categorized.unfavorable}
              color="rgba(239, 68, 68, 0.1)"
              borderColor="rgba(239, 68, 68, 0.3)"
              onAssignMatricule={onAssignMatricule}
              onUpdateDecision={onUpdateDecision}
              canConductInterview={canConductInterview}
              onStartInterview={onStartInterview}
              onViewReport={onViewReport}
              onUnassignInterview={onUnassignInterview}
              session={session}
            />
          </div>
        )
      })()}

      {/* Message si aucun candidat */}
      {candidates.length === 0 && (
        <div style={{
          ...modernDesign.glass.card,
          padding: '48px',
          textAlign: 'center'
        }}>
          <p style={modernDesign.typography.body}>
            Aucun candidat inscrit à cette session
          </p>
        </div>
      )}
    </div>
  )
}

// Composant pour afficher une carte candidat
function CandidateCard({ 
  candidate, 
  onAssignMatricule, 
  onUpdateDecision, 
  canConductInterview,
  onStartInterview,
  onViewReport,
  onUnassignInterview,
  session 
}: any) {
  const [showMatriculeInput, setShowMatriculeInput] = useState(false)
  const [matriculeValue, setMatriculeValue] = useState(candidate.matricule || '')

  const handleMatriculeSubmit = () => {
    if (matriculeValue.trim()) {
      onAssignMatricule(candidate.id, matriculeValue.trim())
      setShowMatriculeInput(false)
    }
  }

  return (
    <div style={{
      ...modernDesign.glass.card,
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '20px',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h3 style={{
            ...modernDesign.typography.subtitle,
            fontSize: '18px',
            margin: '0'
          }}>
            {candidate.firstName} {candidate.lastName}
          </h3>
          
          {/* Matricule */}
          {candidate.matricule ? (
            <div style={{
              ...modernDesign.badges.info,
              fontSize: '12px',
              fontWeight: '600'
            }}>
              #{candidate.matricule}
            </div>
          ) : (
            <button
              onClick={() => setShowMatriculeInput(true)}
              style={{
                ...modernDesign.buttons.secondary,
                padding: '4px 8px',
                fontSize: '11px'
              }}
            >
              + Matricule
            </button>
          )}
        </div>

        {showMatriculeInput && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Matricule (ex: 01)"
              value={matriculeValue}
              onChange={(e) => setMatriculeValue(e.target.value)}
              style={{
                ...modernDesign.inputs.modern,
                padding: '6px 10px',
                fontSize: '12px',
                width: '100px'
              }}
            />
            <button
              onClick={handleMatriculeSubmit}
              style={{
                ...modernDesign.buttons.primary,
                padding: '6px 12px',
                fontSize: '11px'
              }}
            >
              ✓
            </button>
            <button
              onClick={() => setShowMatriculeInput(false)}
              style={{
                ...modernDesign.buttons.secondary,
                padding: '6px 12px',
                fontSize: '11px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        <p style={{
          ...modernDesign.typography.body,
          margin: '0 0 4px 0'
        }}>
          {candidate.email}
        </p>
        <p style={{
          ...modernDesign.typography.body,
          fontSize: '12px',
          opacity: 0.7,
          margin: '0'
        }}>
          Inscrit le {new Date(candidate.registeredAt).toLocaleDateString('fr-FR')}
        </p>
        
        {/* Statut de l'entretien */}
        {candidate.interview && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              ...modernDesign.badges[
                candidate.interview.status === 'COMPLETED' ? 'success' :
                candidate.interview.status === 'IN_PROGRESS' ? 'warning' : 'info'
              ],
              fontSize: '12px',
              marginBottom: '4px'
            }}>
              {candidate.interview.status === 'COMPLETED' ? 'Entretien terminé' :
               candidate.interview.status === 'IN_PROGRESS' ? 'Entretien en cours' : 'Entretien planifié'}
            </div>
            
            {/* Décision d'entretien modifiable */}
            {candidate.interview.status === 'COMPLETED' && candidate.interview.decision && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <select
                  value={candidate.interview.decision}
                  onChange={(e) => onUpdateDecision(candidate.id, e.target.value)}
                  style={{
                    ...modernDesign.inputs.modern,
                    padding: '4px 8px',
                    fontSize: '12px'
                  }}
                >
                  <option value="FAVORABLE">Favorable</option>
                  <option value="A_SURVEILLER">À surveiller</option>
                  <option value="DEFAVORABLE">Défavorable</option>
                </select>
              </div>
            )}

            {candidate.interview.conductedBy && (
              <p style={{
                ...modernDesign.typography.body,
                fontSize: '12px',
                margin: '4px 0 0 0',
                opacity: 0.8
              }}>
                Par: {candidate.interview.conductedBy}
              </p>
            )}
          </div>
        )}

        {/* Informations de quiz en temps réel */}
        {candidate.quizAttempts?.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            {candidate.quizAttempts.map((attempt: any, index: number) => (
              <div key={attempt.id} style={{
                ...modernDesign.glass.light,
                padding: '8px 12px',
                marginTop: index > 0 ? '4px' : '0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>
                    Quiz {attempt.isInProgress ? 'en cours' : 'terminé'}
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: attempt.score > (attempt.totalQuestions * 0.8) ? '#10b981' : '#f59e0b'
                  }}>
                    {attempt.correctAnswers}/{attempt.totalQuestions}
                  </span>
                </div>
                {attempt.isInProgress && (
                  <div style={{
                    ...modernDesign.badges.warning,
                    fontSize: '10px',
                    marginTop: '4px'
                  }}>
                    ⏱️ En cours depuis {new Date(attempt.startedAt).toLocaleTimeString('fr-FR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        {canConductInterview && (
          <>
            {candidate.interview?.status === 'COMPLETED' ? (
              <>
                <button
                  onClick={() => onViewReport(candidate)}
                  style={{
                    ...modernDesign.buttons.primary,
                    padding: '10px 16px',
                    fontSize: '14px'
                  }}
                >
                  📋 Voir le compte-rendu
                </button>
                <button
                  onClick={() => onUnassignInterview(candidate)}
                  style={{
                    ...modernDesign.buttons.secondary,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    padding: '8px 12px',
                    fontSize: '12px'
                  }}
                >
                  🗑️ Désaffecter
                </button>
              </>
            ) : candidate.interview?.status === 'IN_PROGRESS' && 
                candidate.interview.conductedBy === `${session?.user.firstName} ${session?.user.lastName}` ? (
              <>
                <button
                  onClick={() => onStartInterview(candidate)}
                  style={{
                    ...modernDesign.buttons.primary,
                    padding: '10px 16px',
                    fontSize: '14px'
                  }}
                >
                  🎤 Continuer l'entretien
                </button>
                <button
                  onClick={() => onUnassignInterview(candidate)}
                  style={{
                    ...modernDesign.buttons.secondary,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    padding: '8px 12px',
                    fontSize: '12px'
                  }}
                >
                  🗑️ Désaffecter
                </button>
              </>
            ) : candidate.interview?.status === 'IN_PROGRESS' ? (
              <div style={{
                ...modernDesign.glass.card,
                padding: '12px 16px',
                textAlign: 'center',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <p style={{
                  ...modernDesign.typography.body,
                  fontSize: '12px',
                  margin: '0',
                  color: '#fbbf24'
                }}>
                  🔒 Pris en charge par {candidate.interview.conductedBy}
                </p>
              </div>
            ) : (
              <button
                onClick={() => onStartInterview(candidate)}
                style={{
                  ...modernDesign.buttons.primary,
                  padding: '10px 16px',
                  fontSize: '14px'
                }}
              >
                🎤 Prendre en charge l'entretien
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Composant pour afficher une section de candidats par catégorie
function CategorySection({ 
  title, 
  candidates, 
  color, 
  borderColor, 
  onAssignMatricule,
  onUpdateDecision,
  canConductInterview,
  onStartInterview,
  onViewReport,
  onUnassignInterview,
  session 
}: any) {
  if (candidates.length === 0) return null

  return (
    <div style={{
      ...modernDesign.glass.card,
      padding: '24px',
      background: color,
      border: `1px solid ${borderColor}`
    }}>
      <h3 style={{
        ...modernDesign.typography.subtitle,
        fontSize: '20px',
        margin: '0 0 20px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {title}
        <span style={{
          ...modernDesign.badges.info,
          fontSize: '12px'
        }}>
          {candidates.length}
        </span>
      </h3>
      
      <div style={{ display: 'grid', gap: '16px' }}>
        {candidates.map((candidate: any) => (
          <CandidateCard 
            key={candidate.id}
            candidate={candidate}
            onAssignMatricule={onAssignMatricule}
            onUpdateDecision={onUpdateDecision}
            canConductInterview={canConductInterview}
            onStartInterview={onStartInterview}
            onViewReport={onViewReport}
            onUnassignInterview={onUnassignInterview}
            session={session}
          />
        ))}
      </div>
    </div>
  )
}
