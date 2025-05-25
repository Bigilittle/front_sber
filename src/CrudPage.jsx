import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './CrudPage.css';
import { AssistantContext } from './App';
import { normalizeDice } from './normalizeDice';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

function CrudPage() {
  const assistant = useContext(AssistantContext);
  const [diceList, setDiceList] = useState([]);
  const [errors, setErrors] = useState({});
  const [shouldSend, setShouldSend] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);


  const dicePattern = /^-?(\d+([dk]\d+)?)([+-](\d+([dk]\d+)?))*$/i;

  function handleAdd() {
    setDiceList(prev => [...prev, '']);
  }

  function handleChange(index, value) {
    setDiceList(prev => prev.map((d, i) => (i === index ? value : d)));
    setErrors(prev => ({
      ...prev,
      [index]: value !== '' && !dicePattern.test(value),
    }));
  }

  function handleDelete(index) {
    setDiceList(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const e = { ...prev };
      delete e[index];
      return e;
    });
  }

  function goToAdvanced() {
    navigate('/advanced');
  }

  function handleCalculate() {
    if (Object.values(errors).some(Boolean)) {
      return alert('Проверь введённые значения кубов!');
    }
    setIsLoading(true);
    fetch(`${API_URL}/calculation_dumb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dice: diceList }),
    })
      .then(r => r.json())
      .then(data => {
        navigate('/charts', { state: { result: data, diceList } });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }

  const handleAICommand = (action) => {
    switch (action.type) {
      case 'add_dice': {
        const raw = action.dice || '';
        const norm = normalizeDice(raw);
        setDiceList(prev => [...prev, norm]);
        setErrors(prev => ({
          ...prev,
          [prev.length]: norm !== '' && !dicePattern.test(norm),
        }));
        break;
      }
      case 'add_field': {
        handleAdd();
        break;
      }
      case 'update_field': {
        const idx = parseInt(normalizeDice(action.index), 10) - 1;
        if (isNaN(idx)) break;
        const raw = action.value || '';
        const norm = normalizeDice(raw);
        handleChange(idx, norm);
        break;
      }
      case 'delete_field': {
        const idx = parseInt(normalizeDice(action.index), 10) - 1;
        if (isNaN(idx)) break;
        handleDelete(idx);
        break;
      }
      case 'clear_all': {
        setDiceList([]);
        setErrors({});
        break;
      }
      case 'adv_send': {
        setShouldSend(true);
        break;
      }
      case 'go_advanced': {
        goToAdvanced();
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    if (!assistant) return;

    const onStart = () => {};
    const onError = () => {};
    const onData = message => {
      if (message.type === 'smart_app_data' && message.action) {
        handleAICommand(message.action);
      }
    };

    const unsubStart = assistant.on('start', onStart);
    const unsubError = assistant.on('error', onError);
    const unsubData = assistant.on('data', onData);

    return () => {
      unsubStart();
      unsubError();
      unsubData();
    };
  }, [assistant]);

  useEffect(() => {
    if (shouldSend) {
      handleCalculate();
      setShouldSend(false);
    }
  }, [diceList, shouldSend]);

  return (
    <div className="container">
      <div className="center-text">Кидай кубы</div>
      <div className="advanced-link">
        <button onClick={goToAdvanced}>
          Перейти на расширенную версию
        </button>
      </div>
      <div className="dice-list">
        {diceList.map((dice, i) => (
          <div key={i} className="dice-item">
            <input
              type="text"
              value={dice}
              onChange={e => handleChange(i, e.target.value)}
              placeholder="1d8+2 / 1к6 / 14"
              style={{
                border: errors[i] ? '2px solid red' : '1px solid #ccc'
              }}
            />
            <button onClick={() => handleDelete(i)}>×</button>
          </div>
        ))}
      </div>
      <button className="add-btn" onClick={handleAdd}>+ Добавить куб</button>
      <div className="calculate">
        <button onClick={handleCalculate} disabled={isLoading}>
          {isLoading ? (
            <span className="loader"></span>
          ) : (
            'Рассчитать урон...'
          )}
        </button>
      </div>
    </div>
  );
}

export default CrudPage;
