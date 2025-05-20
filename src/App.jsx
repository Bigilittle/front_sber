import './App.css';
import { useEffect, useState, createContext } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { createSmartappDebugger, createAssistant } from '@salutejs/client';
import CrudPage from './CrudPage.jsx';
import ChartsPage from './ChartsPage.jsx';
import AdvancedPage from './AdvancedPage.jsx';

export const AssistantContext = createContext(null);

const initializeAssistant = (getState) => {
  const mode = import.meta.env.VITE_ASSISTANT_MODE;
  const token = import.meta.env.VITE_ASSISTANT_TOKEN;
  const initPhrase = import.meta.env.VITE_ASSISTANT_PHRASE || 'Запусти кубы';

  if (mode === 'debug') {
    return createSmartappDebugger({
      token,
      initPhrase,
      getState,
    });
  } else {
    return createAssistant({ getState });
  }};
  


function App() {
  const location = useLocation();
  const [assistant, setAssistant] = useState(null);

  useEffect(() => {
    const asst = initializeAssistant(() => ({
      path: location.pathname,
    }));
    setAssistant(asst);
    asst.on('start', () => console.log('🟢 Ассистент активирован'));
    asst.on('error', e => console.error('❌ Ошибка ассистента:', e));
    return () => asst.destroy?.();
  }, []); 

  useEffect(() => {
    const root = document.getElementById('root');
    
    // обновляем классы на root
    if (location.pathname === '/') {
      root.classList.add('crud-mode');
      root.classList.remove('charts-mode');
    } else {
      root.classList.remove('crud-mode');
      root.classList.add('charts-mode');
    }
  
    // одновременно обновляем классы на body
    document.body.className =
      location.pathname === '/charts'
        ? 'charts-body'
        : 'crud-body';
  
    return () => {
      root.classList.remove('crud-mode', 'charts-mode');
      document.body.className = '';
    };
  }, [location]);
  
  

  return (
    <AssistantContext.Provider value={assistant}>
      <Routes>
        <Route path="/" element={<CrudPage />} />
        <Route path="/charts" element={<ChartsPage />} />
        <Route path="/advanced" element={<AdvancedPage />} />
      </Routes>
    </AssistantContext.Provider>
  );
}

export default App;
