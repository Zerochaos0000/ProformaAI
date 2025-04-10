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
  document.getElementById('results').innerHTML = `
    <h3 class="text-lg font-bold text-blue-700 mb-2">📊 Results Summary</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>Total Revenue: <span class="font-semibold text-green-700">$${totalRevenue.toLocaleString()}</span></div>
      <div>Total Development Costs: <span class="font-semibold text-red-700">$${totalCosts.toLocaleString()}</span></div>
      <div>Estimated Profit: <span class="font-semibold text-blue-700">$${profit.toLocaleString()}</span></div>
      <div>Loan Amount: <span class="text-gray-700">$${loanAmount.toLocaleString()}</span></div>
      <div>Equity Required: <span class="text-gray-700">$${equityRequired.toLocaleString()}</span></div>
      <div>Annual Debt Service: <span class="text-gray-700">$${annualDebtService.toLocaleString()}</span></div>
      <div class="col-span-2">Cash Flow Before Tax: <span class="font-bold text-blue-700">$${cashFlowBeforeTax.toLocaleString()}</span></div>
    </div>
    <div class="mt-6">
      <h4 class="text-md font-semibold text-gray-800 mb-2">📅 5-Year Phased Cash Flow</h4>
      ${generateCashFlowTable(totalRevenue, totalCosts, annualDebtService)}
    </div>
  `;
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
