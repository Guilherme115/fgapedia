import { useState, useEffect } from 'react';
import ExamCard from '../components/ExamCard';
import { Search } from 'lucide-react';

export default function Home() {
  const [exams, setExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterGabarito, setFilterGabarito] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/exams.json`)
      .then(res => res.json())
      .then(data => setExams(data))
      .catch(err => console.error("Erro ao buscar provas:", err));
  }, []);

  const filteredExams = exams.filter(exam => {
    const matchSearch = exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        exam.professor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType ? exam.examType === filterType : true;
    const matchGabarito = filterGabarito ? exam.hasAnswerKey === true : true;
    
    return matchSearch && matchType && matchGabarito;
  });

  const uniqueTypes = [...new Set(exams.map(e => e.examType).filter(Boolean))];

  return (
    <div className="container" style={{ padding: '48px 24px' }}>
      <section style={{ textAlign: 'center', marginBottom: '64px', maxWidth: '800px', margin: '0 auto 64px auto' }}>
        <h1 style={{ marginBottom: '16px' }}>O Repositório Acadêmico.</h1>
        <p style={{ fontSize: '18px', color: 'var(--on-surface-variant)', marginBottom: '32px' }}>
          Explore, filtre e estude através do maior acervo colaborativo de provas antigas da FCTE UNB.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', backgroundColor: 'var(--surface-container)', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)' }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '12px', color: 'var(--outline)' }}>
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por matéria ou professor..." 
            className="input-editorial"
            style={{ border: 'none', backgroundColor: 'transparent' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '48px' }}>
        <aside>
          <h3 style={{ marginBottom: '24px', borderBottom: '1px solid var(--primary)', paddingBottom: '8px' }}>Filtros</h3>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>Tipo de Avaliação</label>
            <select 
              className="input-editorial" 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Todas</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              <input 
                type="checkbox" 
                checked={filterGabarito} 
                onChange={(e) => setFilterGabarito(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              Possui Gabarito
            </label>
          </div>
        </aside>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Acervo ({filteredExams.length})</h2>
          </div>
          
          {filteredExams.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {filteredExams.map(exam => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--outline)' }}>
              <p>Nenhuma prova encontrada com esses filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
