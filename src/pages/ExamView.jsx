import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';

export default function ExamView() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/exams.json')
      .then(res => res.json())
      .then(data => {
        const found = data.find(e => e.id === id);
        setExam(found);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '48px 24px' }}>Carregando...</div>;
  if (!exam) return <div className="container" style={{ padding: '48px 24px' }}>Prova não encontrada.</div>;

  return (
    <div className="container" style={{ padding: '48px 24px', height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--outline)' }}>
          <ArrowLeft size={20} /> Voltar
        </Link>
        <a href={exam.pdfUrl} download className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} /> Baixar PDF
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', flex: 1, minHeight: 0 }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
          <div>
            <h1 style={{ fontSize: '32px' }}>{exam.subject}</h1>
            <p style={{ fontSize: '18px', color: 'var(--on-surface-variant)', marginTop: '8px' }}>{exam.examType}</p>
          </div>
          
          <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '24px' }}>
            <p><strong>Professor:</strong> {exam.professor}</p>
            <p><strong>Semestre:</strong> {exam.semester}</p>
            <p><strong>Dificuldade:</strong> {exam.difficulty}/5</p>
            <p><strong>Gabarito:</strong> {exam.hasAnswerKey ? 'Sim' : 'Não'}</p>
          </div>

          {exam.tips && (
            <div style={{ backgroundColor: 'var(--surface-container)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Dica do Contribuidor:</strong>
              <p style={{ fontStyle: 'italic', fontSize: '14px' }}>"{exam.tips}"</p>
            </div>
          )}
        </aside>

        <div style={{ backgroundColor: 'var(--surface-container)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--outline-variant)' }}>
          <iframe 
            src={exam.pdfUrl} 
            width="100%" 
            height="100%" 
            style={{ border: 'none' }}
            title={`PDF da Prova de ${exam.subject}`}
          />
        </div>
      </div>
    </div>
  )
}
