import React, { useState, useEffect, useContext } from 'react';
import './AdvancedPage.css';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import DefenseSettings from './DefenseSettings';
import { AssistantContext } from './App';
import { normalizeDice } from './normalizeDice';
import { normalizeWord } from './normalizeWords';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const DAMAGE_TYPES = [
  "Колющий", "Рубящий", "Дробящий", "Огненный", "Холод", "Молния",
  "Кислотный", "Ядовитый", "Некротический", "Излучение", "Силовой",
  "Психический", "Звуковой", "Магический"
];

const SAVE_STATS = [
  "Сила", "Ловкость", "Телосложение", "Интеллект", "Мудрость", "Харизма"
];

const customStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: '#ffffff',
    borderColor: state.isFocused ? '#a95cf7' : '#ccc',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(169, 92, 247, 0.4)' : 'none',
    '&:hover': {
      borderColor: '#a95cf7'
    }
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: '#fff',
    zIndex: 9999
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#6a0dad'
      : state.isFocused
      ? '#e0d4ff'
      : '#fff',
    color: state.isSelected ? 'white' : 'black',
    cursor: 'pointer'
  }),
  singleValue: (base) => ({
    ...base,
    color: '#2c1b18',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#888',
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? '#a95cf7' : '#888',
    '&:hover': {
      color: '#a95cf7'
    }
  }),
};

export default function AdvancedPage() {
  const assistant = useContext(AssistantContext);
  const navigate = useNavigate();

  const [attacks, setAttacks] = useState([]);
  const [errors, setErrors] = useState({});
  const [shouldSend, setShouldSend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initialDefense = {
    kb: '',
    saves: SAVE_STATS.reduce((acc, s) => ({ ...acc, [s]: '' }), {}),
    damageMods: DAMAGE_TYPES.reduce((acc, t) => ({ ...acc, [t]: 'Обычное' }), {})
  };
  const [defenseSettings, setDefenseSettings] = useState(initialDefense);

  const dicePattern = /^-?(\d+([dk]\d+)?)([+-](\d+([dk]\d+)?))*$/i;

  const setKb = (value) => {
    setDefenseSettings(prev => ({
      ...prev,
      kb: String(value).trim()
    }));
  };

  const setSave = (type, value) =>
    setDefenseSettings(prev => ({
      ...prev,
      saves: { ...prev.saves, [type]: Number(value) }
    }));

  const setDamageMod = (type, mode) =>
    setDefenseSettings(prev => ({
      ...prev,
      damageMods: { ...prev.damageMods, [type]: mode }
    }));

  const addAttack = () => {
    setAttacks(prev => [...prev, {
      id: Date.now(),
      rollType: '',
      value: '',
      hasExtra: false,
      damageParams: [],
      saveType: ''
    }]);
  };

  const removeAttack = id => {
    setAttacks(prev => prev.filter(a => a.id !== id));
    setErrors(prev => { const e = { ...prev }; delete e[id]; return e; });
  };

  const handleAttackChange = (id, key, val) =>
    setAttacks(prev => prev.map(a => a.id === id ? { ...a, [key]: val } : a));

  const addDamageParam = id =>
    setAttacks(prev => prev.map(a =>
      a.id === id
        ? { ...a, damageParams: [...a.damageParams, { damage: '', type: '' }] }
        : a
    ));

  const handleParamChange = (id, idx, key, val) => {
    setAttacks(prev => prev.map(a => {
      if (a.id !== id) return a;
      const params = [...a.damageParams];
      params[idx][key] = val;
      return { ...a, damageParams: params };
    }));
    if (key === 'damage') {
      setErrors(prev => {
        const e = { ...prev };
        const attackErr = e[id] || {};
        attackErr[idx] = val !== '' && !dicePattern.test(val);
        return { ...e, [id]: attackErr };
      });
    }
  };

  const removeDamageParam = (id, idx) =>
    setAttacks(prev => prev.map(a => {
      if (a.id !== id) return a;
      const params = [...a.damageParams];
      params.splice(idx, 1);
      return { ...a, damageParams: params };
    }));

  const handleSend = () => {
    if (!defenseSettings.kb?.trim() || isNaN(defenseSettings.kb)) {
      return alert('Введите класс брони персонажа!');
    }
    if (!attacks.length) return alert('Добавьте хотя бы одну атаку!');
    for (const a of attacks) {
      if (!a.rollType) return alert('Выберите тип атаки для каждой атаки!');
      if (a.rollType === 'save' && !a.saveType)
        return alert('Выберите характеристику для спасброска!');
    }
    for (const a of attacks) {
      const err = errors[a.id] || {};
      if (Object.values(err).some(x => x)) return alert('Проверьте значения урона!');
    }

    const payload = {
      ...defenseSettings,
      saves: Object.fromEntries(
        Object.entries(defenseSettings.saves).map(([k, v]) => [k, Number(v) || 0])
      )
    };

    setIsLoading(true);
    fetch(`${API_URL}/calculation_advanced`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ attacks, defenseSettings: payload })
    })
      .then(r => r.json())
      .then(data =>
        navigate('/charts', { state: { result: data, attacks, defenseSettings } })
      )
      .catch(() => alert('Ошибка при отправке данных!'))
      .finally(() => setIsLoading(false));
  };

  // useEffect(() => {
  //   if (shouldSend) {
  //     handleSend();
  //     setShouldSend(false);
  //   }
  // }, [defenseSettings, attacks, shouldSend]);

  const handleAICommand = (action) => {
    switch (action.type) {
      case 'adv_create_attack':
        addAttack();
        break;
      case 'adv_delete_attack':
      case 'delete_field': {
        const idx = parseInt(normalizeDice(action.id || action.index), 10) - 1;
        if (idx >= 0 && idx < attacks.length) {
          removeAttack(attacks[idx].id);
        }
        break;
      }
      case 'adv_set_roll_type': {
        const idx = parseInt(normalizeDice(action.id), 10) - 1;
        if (idx < 0 || idx >= attacks.length) break;
        const attack = attacks[idx];
        const val = normalizeDice(action.value).toLowerCase();
        let rollType = '';
        if (val.includes('атак') || val.includes('attack')) rollType = 'attack';
        else if (val.includes('спас') || val.includes('save') || val.includes('бросок'))
          rollType = 'save';
        if (rollType) handleAttackChange(attack.id, 'rollType', rollType);
        break;
      }
      case 'adv_set_value': {
        const idx = parseInt(normalizeDice(action.id), 10) - 1;
        if (idx < 0 || idx >= attacks.length) break;
        const attack = attacks[idx];
        handleAttackChange(attack.id, 'value', normalizeDice(action.value));
        break;
      }
      case 'adv_set_save_type': {
        const idx = parseInt(normalizeDice(action.id), 10) - 1;
        if (idx < 0 || idx >= attacks.length) break;
        const attack = attacks[idx];
        const stat = normalizeWord(action.value, 'stat');
        if (stat) handleAttackChange(attack.id, 'saveType', stat);
        break;
      }
      case 'adv_toggle_extra': {
        const idx = parseInt(normalizeDice(action.id), 10) - 1;
        if (idx < 0 || idx >= attacks.length) break;
        const attack = attacks[idx];
        const flag = ['true', 'включи', 'поставь', 'да'].includes(
          String(action.value).toLowerCase()
        );
        handleAttackChange(attack.id, 'hasExtra', flag);
        break;
      }
      case 'adv_add_damage': {
        const idx = parseInt(normalizeDice(action.id), 10) - 1;
        if (idx < 0 || idx >= attacks.length) break;
        addDamageParam(attacks[idx].id);
        break;
      }
      case 'adv_delete_damage': {
        const ai = parseInt(normalizeDice(action.id), 10) - 1;
        const di = parseInt(normalizeDice(action.index), 10) - 1;
        if (ai < 0 || ai >= attacks.length) break;
        const attack = attacks[ai];
        if (di >= 0 && di < attack.damageParams.length) {
          removeDamageParam(attack.id, di);
        }
        break;
      }
      case 'adv_set_damage_value': {
        const ai = parseInt(normalizeDice(action.id), 10) - 1;
        const di = parseInt(normalizeDice(action.index), 10) - 1;
        if (ai < 0 || ai >= attacks.length) break;
        handleParamChange(attacks[ai].id, di, 'damage', normalizeDice(action.value));
        break;
      }
      case 'adv_set_damage_type': {
        const ai = parseInt(normalizeDice(action.id), 10) - 1;
        const di = parseInt(normalizeDice(action.index), 10) - 1;
        if (ai < 0 || ai >= attacks.length) break;
        const matched = normalizeWord(action.value, 'damage');
        if (matched) handleParamChange(attacks[ai].id, di, 'type', matched);
        break;
      }
      case 'adv_set_kb': {
        const val = normalizeDice(action.value);
        if (!isNaN(val)) {
          setDefenseSettings(prev => ({ ...prev, kb: val }));
        }
        break;
      }
      case 'adv_send':
        setShouldSend(true);
        break;
      case 'adv_back_simple':
        navigate('/');
        break;
      case 'adv_set_save': {
        const stat = normalizeWord(action.stat, 'stat');
        const num = normalizeDice(action.value);
        if (stat && !isNaN(num)) setSave(stat, num);
        break;
      }
      case 'adv_set_resistance': {
        const typ = normalizeWord(action.damageType, 'damage');
        const mode = action.mode.toLowerCase().trim();
        if (typ && ['обычное','уязвимость','устойчивость'].includes(mode)) {
          setDamageMod(typ,
            mode === 'уязвимость' ? 'Уязвимость' :
            mode === 'устойчивость' ? 'Устойчивость' : 'Обычное'
          );
        }
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    if (!assistant) return;
    const unsubStart = assistant.on('start', () => {});
    const unsubErr   = assistant.on('error', () => {});
    const unsubData  = assistant.on('data', msg => {
      if (msg.type === 'smart_app_data' && msg.action) {
        handleAICommand(msg.action);
      }
    });
    return () => { unsubStart(); unsubErr(); unsubData(); };
  }, [assistant, attacks]);

  return (
    <div className="adv-container">
      <h1 className="adv-title">Кидай кубы</h1>
      <div className="adv-back-link">
        <button onClick={() => navigate('/')}>Вернуться к упрощённой версии</button>
      </div>

      <div className="adv-attack-list">
        {attacks.map((attack, i) => (
          <div key={attack.id} className="adv-attack-block">
            <h2>Атака {i + 1}</h2>
            <button
              onClick={() => removeAttack(attack.id)}
              className="adv-delete-attack-btn"
            >Удалить атаку</button>

            <div className="adv-attack-meta">
              <div className="adv-field-row">
                <select
                  value={attack.rollType}
                  onChange={e => handleAttackChange(attack.id, 'rollType', e.target.value)}
                >
                  <option value="">Тип атаки</option>
                  <option value="attack">Бросок атаки</option>
                  <option value="save">Спасбросок</option>
                </select>
                <input
                  type="number"
                  placeholder={attack.rollType==='save'?'Сложность':'Модификатор'}
                  value={attack.value}
                  onChange={e=>handleAttackChange(attack.id,'value',e.target.value)}
                />
              </div>
              {attack.rollType==='save' && (
                <select
                  value={attack.saveType}
                  onChange={e=>handleAttackChange(attack.id,'saveType',e.target.value)}
                  className="adv-save-type-select"
                >
                  <option value="">Выберите характеристику</option>
                  {SAVE_STATS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <div className="adv-toggle-wrapper">
                <label className="adv-toggle-switch">
                  <input
                    type="checkbox"
                    checked={attack.hasExtra}
                    onChange={e=>handleAttackChange(attack.id,'hasExtra',e.target.checked)}
                  />
                  <span className="adv-slider" />
                  <span className="adv-toggle-label">
                    {attack.rollType==='save'
                      ? 'Половина урона при провале'
                      : 'Преимущество на атаку'}
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={() => addDamageParam(attack.id)}
              className="adv-add-field-btn"
            >Добавить параметр урона</button>

            {attack.damageParams.map((p, idx) => (
              <div key={idx} className="adv-field-row adv-damage-row">
                <input
                  type="text"
                  placeholder="1d8+2 / 1к6 / 14"
                  value={p.damage}
                  onChange={e=>handleParamChange(attack.id,idx,'damage',e.target.value)}
                  style={{
                    border: errors[attack.id]?.[idx]
                      ? '2px solid red'
                      : '1px solid #ccc'
                  }}
                />
                <div className="adv-select-wrapper">
                  <Select
                    options={DAMAGE_TYPES.map(t=>({value:t,label:t}))}
                    placeholder="Тип урона"
                    value={
                      DAMAGE_TYPES.includes(p.type)
                        ? { value: p.type, label: p.type }
                        : null
                    }
                    styles={customStyles}
                    onChange={sel=>handleParamChange(attack.id,idx,'type',sel?.value||'')}
                    isClearable
                  />
                </div>
                <button
                  onClick={()=>removeDamageParam(attack.id,idx)}
                  className="adv-delete-btn"
                >❌</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="adv-add-wrapper">
        <button onClick={addAttack} className="adv-add-btn">Добавить атаку</button>
      </div>

      <DefenseSettings settings={defenseSettings} onChange={setDefenseSettings} />

      <div className="adv-send-wrapper">
        <button 
          onClick={handleSend}
          className="adv-send-btn"
          disabled={isLoading}
        >
          {isLoading
            ? <span className="loader"></span>
            : "Отправить данные"
          }
        </button>
      </div>
      <div style={{ height: 300 }} />
    </div>
  );
}
