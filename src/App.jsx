import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import ExamView from './pages/ExamView'
import { BookOpen } from 'lucide-react'

function App() {
  return (
    <>
      <header style={{ borderBottom: '1px solid var(--outline-variant)', padding: '16px 0', backgroundColor: 'var(--surface-bright)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: '600', color: 'var(--primary)' }}>
            <BookOpen size={28} />
            FGApédia
          </Link>
          <a href="https://github.com/Guilherme115/fgapedia/issues/new/choose" target="_blank" rel="noreferrer" className="btn-primary">
            Enviar Prova
          </a>
        </div>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/prova/:id" element={<ExamView />} />
        </Routes>
      </main>
    </>
  )
}

export default App
