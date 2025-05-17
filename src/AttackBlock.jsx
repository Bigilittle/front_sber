import { useState } from 'react';
import './App.css';

const DAMAGE_TYPES = [
  "Колющий", "Рубящий", "Дробящий", "Огненный", "Холод", "Молния",
  "Кислотный", "Ядовитый", "Некротический", "Излучение", "Силовой",
  "Психический", "Звуковой", "Магический"
];

const damageOptions = DAMAGE_TYPES.map(type => (
  <option key={type} value={type}>{type}</option>
));

const blankAttack = {
  id: null,
  rollType: '',
  value: '',
  hasExtra: false,
  damageParams: [],
};

export default function App() {
  const [attacks, setAttacks] = useState([]);

  const addAttack = () => {
    setAttacks([...attacks, { ...blankAttack, id: Date.now() }]);
  };

  const updateAttack = (id, changes) => {
    setAttacks(attacks.map(at => at.id === id ? { ...at, ...changes } : at));
  };

  const removeAttack = id => {
    setAttacks(attacks.filter(at => at.id !== id));
  };

  const addDamageParam = attackId => {
    const attack = attacks.find(at => at.id === attackId);
    updateAttack(attackId, {
      damageParams: [...attack.damageParams, { damage: '', type: '' }]
    });
  };

  const updateParam = (attackId, idx, key, value) => {
    const attack = attacks.find(at => at.id === attackId);
    const arr = attack.damageParams.map((p, i) =>
      i === idx ? { ...p, [key]: value } : p
    );
    updateAttack(attackId, { damageParams: arr });
  };

  const removeParam = (attackId, idx) => {
    const attack = attacks.find(at => at.id === attackId);
    const arr = attack.damageParams.filter((_, i) => i !== idx);
    updateAttack(attackId, { damageParams: arr });
  };

  const handleSend = () => {};

  return (
    <div className="container">
      <h1 className="title">Кидай кубы</h1>

      <div className="attack-list">
        {attacks.map((attack, ai) => {
          const showValue = attack.rollType !== '';
          const labelValue = attack.rollType === 'save'
            ? 'Сложность спасброска:' 
            : 'Модификатор атаки:';
          const placeholderValue = attack.rollType === 'save' ? '15' : '+5';

          return (
            <div key={attack.id} className="attack-block">
              <button
                className="delete-attack-btn"
                onClick={() => removeAttack(attack.id)}
                title="Удалить блок"
              >×</button>

              <div className="field-row">
                <select
                  value={attack.rollType}
                  onChange={e => {
                    const val = e.target.value;
                    updateAttack(attack.id, {
                      rollType: val,
                      value: '',
                      hasExtra: false,
                      damageParams: []
                    });
                  }}
                >
                  <option value="">Тип атаки</option>
                  <option value="attack">Бросок атаки</option>
                  <option value="save">Спасбросок</option>
                </select>
              </div>

              {showValue && (
                <div className="field-row">
                  <input
                    type="text"
                    placeholder={placeholderValue}
                    value={attack.value}
                    onChange={e =>
                      updateAttack(attack.id, { value: e.target.value })
                    }
                  />
                </div>
              )}

              {showValue && (
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={attack.hasExtra}
                    onChange={e =>
                      updateAttack(attack.id, { hasExtra: e.target.checked })
                    }
                  />
                  <span className="slider" />
                  <span className="toggle-label">
                    {attack.rollType === 'attack'
                      ? 'Преимущество на атаку'
                      : 'Половина урона при провале'}
                  </span>
                </label>
              )}

              {showValue && (
                <>
                  <button
                    className="add-field-btn"
                    onClick={() => addDamageParam(attack.id)}
                  >
                    Добавить параметр урона
                  </button>

                  {attack.damageParams.map((param, idx) => (
                    <div key={idx} className="field-row damage-row">
                      <input
                        type="text"
                        placeholder="Урон"
                        value={param.damage}
                        onChange={e =>
                          updateParam(attack.id, idx, 'damage', e.target.value)
                        }
                      />

                      <select
                        value={param.type}
                        onChange={e =>
                          updateParam(attack.id, idx, 'type', e.target.value)
                        }
                      >
                        <option value="">Тип урона</option>
                        {damageOptions}
                      </select>

                      <button
                        className="delete-btn"
                        onClick={() => removeParam(attack.id, idx)}
                        title="Удалить параметр"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="add-wrapper">
        <button onClick={addAttack} className="add-btn">
          + Добавить атаку
        </button>
      </div>

      <div className="send-wrapper">
        <button onClick={handleSend} className="send-btn">
          Отправить данные
        </button>
      </div>
    </div>
  );
}
