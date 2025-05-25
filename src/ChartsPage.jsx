import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './ChartsPage.css';
import { AssistantContext } from './App';
import { normalizeDice } from './normalizeDice';

function generateColor(index) {
  const hue = (index * 137.508) % 360;
  return `hsl(${hue}, 65%, 60%)`;
}

function prepareChartData(result) {
  const allKeys = new Set();
  result.forEach(item => {
    Object.keys(item.damage).forEach(k => allKeys.add(k));
  });
  const keysArray = Array.from(allKeys).sort((a, b) => Number(a) - Number(b));
  return keysArray.map(k => {
    const entry = { name: k };
    result.forEach(item => {
      entry[`d${item.id}`] = item.damage[k] || 0;
    });
    return entry;
  });
}

export default function ChartsPage() {
  const assistant = useContext(AssistantContext);
  const location = useLocation();
  const navigate = useNavigate();

  const { result } = location.state || { result: [] };
  const chartData = prepareChartData(result);
  const [visibleGraphs, setVisibleGraphs] = useState(result.map(() => true));

  // --- Масштаб и шаг ---
  const [zoomStep, setZoomStep] = useState(10); // шаг в %
  const [zoomInput, setZoomInput] = useState('10'); // строка для input (разделено, чтобы юзер мог стереть)
  const [scale, setScale] = useState(100); // текущий масштаб в %

  function handleInputChange(e) {
    const val = e.target.value;
    // Даём юзеру стирать поле, не мешаем
    if (/^\d{0,3}$/.test(val)) {
      setZoomInput(val);
    }
  }

  // Сохраняем шаг только при потере фокуса или Enter
  function commitStepChange() {
    let num = parseInt(zoomInput, 10);
    if (isNaN(num) || num <= 0) num = zoomStep; // Не сохраняем мусор, оставляем старое значение
    setZoomStep(num);
    setZoomInput(num.toString());
  }

  function handleInputBlur() {
    commitStepChange();
  }

  function handleInputKeyDown(e) {
    if (e.key === 'Enter') {
      commitStepChange();
    }
  }

  function handleDecrease() {
    setScale(prev => Math.max(10, prev - zoomStep));
  }
  function handleIncrease() {
    setScale(prev => Math.min(300, prev + zoomStep));
  }

  function toggleGraph(idx) {
    setVisibleGraphs(prev => {
      const updated = [...prev];
      updated[idx] = !updated[idx];
      return updated;
    });
  }

  // --- Команды ассистента ---
  const handleAICommand = (action) => {
    switch (action.type) {
      case 'adv_back_simple':
        navigate('/');
        break;
      case 'zoom_set_step': {
        const val = parseInt(normalizeDice(action.value), 10);
        if (!isNaN(val) && val > 0) {
          setZoomStep(val);
          setZoomInput(val.toString());
        }
        break;
      }
      case 'zoom_increase':
        handleIncrease();
        break;
      case 'zoom_decrease':
        handleDecrease();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!assistant) return;
    const unsubStart = assistant.on('start', () => {});
    const unsubError = assistant.on('error', () => {});
    const unsubData = assistant.on('data', message => {
      if (message.type === 'smart_app_data' && message.action) {
        handleAICommand(message.action);
      }
    });
    return () => { unsubStart(); unsubError(); unsubData(); };
  }, [assistant]);

  if (!result.length) {
    return (
      <div className="container-graph">
        <h2>Нет данных для отображения</h2>
        <button onClick={() => navigate('/')}>Вернуться на главный экран</button>
      </div>
    );
  }

  return (
    <div className="container-graph">
      <button className="back-btn" onClick={() => navigate('/')}>⬅ Вернуться на главный экран</button>
      <h2 className="title-graph">Графики</h2>

      <div className="custom-legend">
        {result.map((item, idx) => {
          const isTotal = idx === result.length - 1;
          const label = isTotal
            ? (visibleGraphs[idx] ? 'Скрыть Общее значение' : 'Показать Общее значение')
            : (visibleGraphs[idx] ? `Скрыть Атаку ${idx + 1}` : `Показать Атаку ${idx + 1}`);
          return (
            <button
              key={idx}
              onClick={() => toggleGraph(idx)}
              style={{
                background: visibleGraphs[idx] ? generateColor(idx) : "#e5e7eb",
                color: visibleGraphs[idx] ? "#fff" : "#333",
                margin: '8px 10px',
                minWidth: 180,
                minHeight: 48,
                fontSize: '1.15rem',
                fontWeight: 600,
                borderRadius: '12px',
                border: 'none',
                boxShadow: "0 2px 8px rgba(106,13,173,0.10)",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s, transform 0.1s"
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* --- Зум-контролы --- */}
      <div className="zoom-panel">
        <label className="zoom-step">
          Шаг изменения:&nbsp;
          <input
            type="text"
            min="1"
            max="100"
            step="1"
            value={zoomInput}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="zoom-input"
            inputMode="numeric"
            pattern="[0-9]*"
          />%
        </label>
        <div className="zoom-current">
          Общий показатель масштаба: <b>{scale}%</b>
        </div>
        <button className="zoom-btn" onClick={handleDecrease}>Уменьшить масштаб</button>
        <button className="zoom-btn" onClick={handleIncrease}>Увеличить масштаб</button>
      </div>

      <div className="chart-scroll-wrapper">
        <div
          className="chart-fixed-width"
          style={{
            width: `${800 * scale / 100}px`,
            height: `${500 * scale / 100}px`,
            minWidth: `${800 * scale / 100}px`,
            minHeight: `${500 * scale / 100}px`
          }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {result.map((item, idx) => {
                if (!visibleGraphs[idx]) return null;
                const isTotal = idx === result.length - 1;
                const name = isTotal ? 'Общее значение' : `Атака ${idx + 1}`;
                return (
                  <Area
                    key={idx}
                    type="monotone"
                    dataKey={`d${item.id}`}
                    stroke={generateColor(idx)}
                    fill={generateColor(idx)}
                    name={name}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
