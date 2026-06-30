import { Link } from 'react-router-dom';
import { FileText, CheckCircle2 } from 'lucide-react';

export default function ExamCard({ exam }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="chip">{exam.examType || 'Prova'}</span>
          {exam.hasAnswerKey && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#1a1a1a', fontWeight: '600' }}>
              <CheckCircle2 size={14} /> Gabarito
            </span>
          )}
        </div>
        <h3 style={{ marginTop: '12px', marginBottom: '4px' }}>{exam.subject}</h3>
        <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>Prof. {exam.professor} • Semestre {exam.semester}</p>
      </div>
      
      {exam.tips && (
        <div style={{ padding: '12px', backgroundColor: 'var(--surface-dim)', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontStyle: 'italic' }}>
          "{exam.tips}"
        </div>
      )}
      
      <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--outline-variant)' }}>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Dificuldade: {exam.difficulty}/5</span>
        <Link to={`/prova/${exam.id}`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={16} /> Ver Prova
        </Link>
      </div>
    </div>
  )
}
