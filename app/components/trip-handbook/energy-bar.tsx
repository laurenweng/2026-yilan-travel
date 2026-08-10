type EnergyBarProps = {
  percent: number;
};

const clampPercent = (percent: number) => Math.min(100, Math.max(0, percent));

const getEnergyTierClassName = (percent: number) => {
  if (percent < 30) return "energy-bar-fill-tier-low";
  if (percent < 50) return "energy-bar-fill-tier-mid";
  return "";
};

export const EnergyBar = ({ percent }: EnergyBarProps) => {
  const clampedPercent = clampPercent(percent);
  const tierClassName = getEnergyTierClassName(clampedPercent);

  return (
    <div
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={clampedPercent}
      className="energy-bar"
      role="progressbar"
    >
      <div className="energy-bar-track">
        <div
          className={`energy-bar-fill${tierClassName ? ` ${tierClassName}` : ""}`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
};
