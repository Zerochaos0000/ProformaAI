// main.js

function parseCurrency(val) {
  return +String(val).replace(/[^\d.-]/g, '') || 0;
}

document.getElementById('calculate').addEventListener('click', function () {
  const lots = parseCurrency(document.getElementById('totalLots').value);
  const avgSale = parseCurrency(document.getElementById('avgSalePrice').value);
  const salesAbsorption = parseCurrency(document.getElementById('salesAbsorption').value);
  const siteCost = parseCurrency(document.getElementById('siteCost').value);
  const offsiteCost = parseCurrency(document.getElementById('offsiteCost').value);
  const permitFees = parseCurrency(document.getElementById('permits').value);
  const loanAmount = parseCurrency(document.getElementById('loanAmount').value);
  const interestRate = parseCurrency(document.getElementById('interestRate').value) / 100;
  const loanTerm = parseCurrency(document.getElementById('loanTerm').value);
  const purchasePrice = parseCurrency(document.getElementById('purchasePrice').value);

  const totalRevenue = lots * avgSale;
  const totalDevelopmentCost = siteCost + offsiteCost + permitFees;
  const interest = loanAmount * interestRate * (loanTerm / 12);
  const totalCost = totalDevelopmentCost + purchasePrice + interest;
  const grossProfit = totalRevenue - totalCost;

  const monthsToSellOut = Math.ceil(lots / salesAbsorption);
  let cashFlows = [];
  for (let i = 1; i <= monthsToSellOut; i++) {
    const monthlySales = Math.min(salesAbsorption, lots - ((i - 1) * salesAbsorption));
    const monthlyRevenue = monthlySales * avgSale;
    const monthlyCost = (totalCost / monthsToSellOut);
    const monthlyCashFlow = monthlyRevenue - monthlyCost;
    cashFlows.push({ month: i, revenue: monthlyRevenue, cost: monthlyCost, cashFlow: monthlyCashFlow });
  }

  let resultsHTML = `
    <h3 class="text-xl font-semibold mt-6 mb-2">📊 Results Summary</h3>
    <ul class="space-y-2">
      <li><strong>Total Revenue:</strong> $${totalRevenue.toLocaleString()}</li>
      <li><strong>Total Development Cost:</strong> $${totalDevelopmentCost.toLocaleString()}</li>
      <li><strongFinancing Cost (Interest):</strong> $${interest.toLocaleString()}</li>
      <li><strong>Total Cost (Including Purchase):</strong> $${totalCost.toLocaleString()}</li>
      <li><strong>Gross Profit:</strong> $${grossProfit.toLocaleString()}</li>
      <li><strong>Months to Sell Out:</strong> ${monthsToSellOut}</li>
    </ul>
    <h3 class="text-xl font-semibold mt-6 mb-2">📅 Monthly Cash Flow Projection</h3>
    <table class="min-w-full text-sm text-left border border-gray-300">
      <thead class="bg-blue-100">
        <tr><th class="px-4 py-2">Month</th><th class="px-4 py-2">Revenue</th><th class="px-4 py-2">Cost</th><th class="px-4 py-2">Cash Flow</th></tr>
      </thead>
      <tbody>
        ${cashFlows.map(row => `
          <tr class="border-t">
            <td class="px-4 py-2">${row.month}</td>
            <td class="px-4 py-2">$${row.revenue.toLocaleString()}</td>
            <td class="px-4 py-2">$${row.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            <td class="px-4 py-2">$${row.cashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('results').innerHTML = resultsHTML;
});
