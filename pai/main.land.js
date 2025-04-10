document.getElementById('calculate').addEventListener('click', calculateProforma);

function parseNumber(val) {
  return +val.replace(/[^0-9.-]+/g, '') || 0;
}

function calculateProforma() {
  const lots = parseNumber(document.getElementById('totalLots').value);
  const pricePerLot = parseNumber(document.getElementById('pricePerLot').value);
  const totalRevenue = lots * pricePerLot;

  const siteCostPerLot = parseNumber(document.getElementById('siteCostPerLot').value);
  const totalSiteCost = lots * siteCostPerLot;

  const softCosts = parseNumber(document.getElementById('softCosts').value);
  const otherCosts = parseNumber(document.getElementById('otherCosts').value);
  const financingCost = parseNumber(document.getElementById('financingCost').value);

  const totalCosts = totalSiteCost + softCosts + otherCosts + financingCost;
  const profit = totalRevenue - totalCosts;

  const loanAmount = parseNumber(document.getElementById('loanAmount').value);
  const interestRate = parseNumber(document.getElementById('interestRate').value) / 100;
  const termYears = parseNumber(document.getElementById('loanTerm').value);

  const monthlyRate = interestRate / 12;
  const numPayments = termYears * 12;
  const annualDebtService = loanAmount > 0
    ? (loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments))) * 12
    : 0;

  const equityRequired = totalCosts - loanAmount;
  const cashFlowBeforeTax = profit - annualDebtService;

  // Output results
  document.getElementById('calculate').addEventListener('click', () => {
  const lotCount = parseInt(document.getElementById('lotCount').value) || 0;
  const salePricePerLot = parseFloat(document.getElementById('salePricePerLot').value.replace(/[^0-9.]/g, '')) || 0;
  const siteCost = parseFloat(document.getElementById('siteCost').value.replace(/[^0-9.]/g, '')) || 0;
  const softCost = parseFloat(document.getElementById('softCost').value.replace(/[^0-9.]/g, '')) || 0;
  const carryingCost = parseFloat(document.getElementById('carryingCost').value.replace(/[^0-9.]/g, '')) || 0;
  const sellingCost = parseFloat(document.getElementById('sellingCost').value.replace(/[^0-9.]/g, '')) || 0;

  const totalRevenue = lotCount * salePricePerLot;
  const totalCost = siteCost + softCost + carryingCost + sellingCost;
  const profit = totalRevenue - totalCost;

  document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toLocaleString();
  document.getElementById('totalCost').textContent = '$' + totalCost.toLocaleString();
  document.getElementById('profit').textContent = '$' + profit.toLocaleString();
});

}

function generateCashFlowTable(totalRevenue, totalCosts, debtService) {
  let html = `<table class="w-full text-sm text-left border"><thead class="bg-gray-100">
    <tr><th class="p-2 border">Year</th><th class="p-2 border">Revenue</th><th class="p-2 border">Cost</th><th class="p-2 border">NOI</th><th class="p-2 border">Debt</th><th class="p-2 border">Cash Flow</th></tr></thead><tbody>`;
  for (let i = 1; i <= 5; i++) {
    const factor = 1 / 5;
    const revenue = totalRevenue * factor;
    const cost = totalCosts * factor;
    const noi = revenue - cost;
    const cash = noi - debtService * factor;
    html += `<tr>
      <td class="p-2 border">Year ${i}</td>
      <td class="p-2 border">$${revenue.toLocaleString()}</td>
      <td class="p-2 border">$${cost.toLocaleString()}</td>
      <td class="p-2 border">$${noi.toLocaleString()}</td>
      <td class="p-2 border">$${(debtService * factor).toLocaleString()}</td>
      <td class="p-2 border font-semibold">$${cash.toLocaleString()}</td>
    </tr>`;
  }

  html += `</tbody></table>`;
  return html;
}
