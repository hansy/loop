export const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const USDCWeiToUSD = (amount: bigint) => {
  return Number(amount) / 10 ** 6;
};

export const usdToUSDCWei = (amount: number) => {
  return BigInt(amount) * BigInt(10 ** 6);
};

export const formatUSDCWeiToUSD = (amount: bigint) => {
  return formatMoney(USDCWeiToUSD(amount));
};
