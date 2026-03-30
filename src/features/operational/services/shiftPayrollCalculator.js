const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateShiftCompensation = ({
  totalDurationHours,
  totalGrossIncome,
}) => {
  const hours = Math.max(0, toNumber(totalDurationHours));
  const grossIncome = Math.max(0, toNumber(totalGrossIncome));

  let basePay = 0;
  let tier = 'short';
  if (hours < 4) {
    basePay = grossIncome * 0.1;
    tier = 'short';
  } else if (hours < 8) {
    basePay = 20000;
    tier = 'regular';
  } else if (hours > 15) {
    basePay = 50000;
    tier = 'extended';
  } else {
    basePay = 30000;
    tier = 'full';
  }

  const standardShiftHours = 8;
  const overtimeHours = Math.max(0, hours - standardShiftHours);
  let overtimePay = 0;
  if (overtimeHours > 0) {
    if (hours > 15) {
      overtimePay = overtimeHours * 2500;
    } else {
      overtimePay =
        overtimeHours <= 1
          ? overtimeHours * 3000
          : 3000 + (overtimeHours - 1) * 5000;
    }
  }

  const performanceBonus = grossIncome * 0.05;
  const totalPay = Math.max(0, basePay + overtimePay + performanceBonus);

  return {
    totalPay,
    breakdown: {
      tier,
      basePay,
      overtimeHours,
      overtimePay,
      performanceBonus,
      totalPay,
    },
  };
};
