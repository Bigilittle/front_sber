import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './ChartsPage.css';
import { AssistantContext } from './App';

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

  function toggleGraph(idx) {
    const updated = [...visibleGraphs];
    updated[idx] = !updated[idx];
    setVisibleGraphs(updated);
  }

  const handleAICommand = (action) => {
    if (action.type === 'adv_back_simple') {
      navigate('/');
    }
  };

  useEffect(() => {
    if (!assistant) return;
    const unsubStart = assistant.on('start', () => console.log('🟢 Ассистент Charts активирован'));
    const unsubError = assistant.on('error', err => console.error('❌ Ошибка ассистента Charts:', err));
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

      <div className="chart-scroll-wrapper">
        <div className="chart-fixed-width">
          <ResponsiveContainer width="100%" height={500}>
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