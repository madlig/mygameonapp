const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateSuccessfulOrders = (
  totalOrders,
  canceledOrders,
  returnedOrders
) => {
  const successful =
    toNumber(totalOrders) - toNumber(canceledOrders) - toNumber(returnedOrders);
  return Math.max(0, successful);
};

export const calculateActualGrossIncome = (
  grossIncome,
  canceledValue,
  returnedValue
) => toNumber(grossIncome) - toNumber(canceledValue) - toNumber(returnedValue);

export const calculateAdminFee = (actualGrossIncome, voucherCost) => {
  const adminFeeBase = toNumber(actualGrossIncome) - toNumber(voucherCost);
  return adminFeeBase * 0.075;
};

export const calculateProcessingFee = (successfulOrders) =>
  toNumber(successfulOrders) * 1250;

export const calculateNetRevenue = ({
  grossIncome,
  canceledValue,
  returnedValue,
  totalOrders,
  canceledOrders,
  returnedOrders,
  voucherCost,
  adSpend,
}) => {
  const successfulOrders = calculateSuccessfulOrders(
    totalOrders,
    canceledOrders,
    returnedOrders
  );
  const actualGrossIncome = calculateActualGrossIncome(
    grossIncome,
    canceledValue,
    returnedValue
  );
  const adminFee = calculateAdminFee(actualGrossIncome, voucherCost);
  const processingFee = calculateProcessingFee(successfulOrders);

  return (
    actualGrossIncome -
    toNumber(voucherCost) -
    adminFee -
    processingFee -
    toNumber(adSpend)
  );
};

export const buildFinancialSnapshot = (inputs) => {
  const successfulOrders = calculateSuccessfulOrders(
    inputs.totalOrders,
    inputs.canceledOrders,
    inputs.returnedOrders
  );
  const calculatedNetRevenue = calculateNetRevenue(inputs);

  return {
    successfulOrders,
    calculatedNetRevenue,
  };
};
