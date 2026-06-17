const STEPS = [
  { id: 1, label: 'Profile', icon: '👤' },
  { id: 2, label: 'Identity', icon: '🪪' },
  { id: 3, label: 'Employment', icon: '💼' },
  { id: 4, label: 'Education', icon: '🎓' },
];

export default function StepIndicator({ current, total = 4 }) {
  const progress = ((current) / total) * 100;

  return (
    <div className="step-indicator">
      <div className="step-progress-track">
        <div className="step-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="step-list">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`step-item ${current === step.id ? 'active' : ''} ${current > step.id ? 'done' : ''}`}
          >
            <span className="step-circle">
              {current > step.id ? '✓' : step.icon}
            </span>
            <span className="step-label">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
