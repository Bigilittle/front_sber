import React from 'react';

const DAMAGE_TYPES = [
  "Колющий","Рубящий","Дробящий","Огненный","Холод","Молния",
  "Кислотный","Ядовитый","Некротический","Излучение","Силовой",
  "Психический","Звуковой","Магический"
];
const SAVE_TYPES = [
  "Сила","Ловкость","Телосложение","Интеллект","Мудрость","Харизма"
];

export default function DefenseSettings({ settings, onChange }) {
  const { kb, saves, damageMods } = settings;

  const handleKbChange = e =>
    onChange({ ...settings, kb: e.target.value });

  const handleSaveChange = (type, val) =>
    onChange({
      ...settings,
      saves: { ...saves, [type]: val }
    });

  const handleDamageModChange = (type, mode) =>
    onChange({
      ...settings,
      damageMods: { ...damageMods, [type]: mode }
    });

  return (
    <div className="defense-settings">
      <h2>Настройки Защиты</h2>

      <div className="field-row">
        <label>Класс Брони (КБ):</label>
        <input
          type="number"
          value={kb}
          onChange={handleKbChange}
          placeholder="Введите КБ"
        />
      </div>

      <h3>Спасброски</h3>
      {SAVE_TYPES.map(save => (
        <div key={save} className="field-row">
          <label>{save}:</label>
          <input
            type="number"
            value={saves[save]}
            onChange={e => handleSaveChange(save, e.target.value)}
          />
        </div>
      ))}

      <h3>Типы Урона</h3>
      {DAMAGE_TYPES.map(type => (
        <div key={type} className="field-row">
          <label>{type}:</label>
          <select
            value={damageMods[type]}
            onChange={e => handleDamageModChange(type, e.target.value)}
          >
            <option value="Обычное">Обычное</option>
            <option value="Уязвимость">Уязвимость</option>
            <option value="Устойчивость">Устойчивость</option>
          </select>
        </div>
      ))}
    </div>
  );
}
