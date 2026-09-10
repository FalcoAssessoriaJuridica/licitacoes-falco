import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CasoNovo from './pages/CasoNovo.jsx';
import CasoDetalhe from './pages/CasoDetalhe.jsx';
import CasoGerar from './pages/CasoGerar.jsx';
import Peca from './pages/Peca.jsx';
import Configuracoes from './pages/Configuracoes.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/casos/novo" element={<CasoNovo />} />
        <Route path="/casos/:id" element={<CasoDetalhe />} />
        <Route path="/casos/:id/gerar" element={<CasoGerar />} />
        <Route path="/casos/:id/pecas/:pecaId" element={<Peca />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
