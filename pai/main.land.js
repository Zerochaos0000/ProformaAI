// main-land.js

// Event Listeners
document.getElementById('calculate').addEventListener('click', calculateProforma);
document.getElementById('exportPdf').addEventListener('click', () => window.print());
document.getElementById('exportXls').addEventListener('click', exportToExcel);
document.getElementById('autofillDemo').addEventListener('click', autofillSample);

function parseCurrency(val) {
  return +val.toString().replace(/[^0-9.-]+/g, '') || 0;
}

function calculateProforma() {
  const totalLots = parseCurrency(document.getElementById('totalLots').value);
  const lotSalePrice = parseCurrency(document.getElementById('lotSalePrice').value);
  const monthlyAbsorption = parseCurrency(document.getElementById('monthlyAbsorption').value);
  const devCost = parseCurrency(document.getElementById('devCost').value);
  const softCost = parseCurrency(document.getElementById('softCost').value);
  const loanAmount = parseCurrency(document.getElementById('loanAmount').value);
  const loanRate = parseCurrency(document.getElementById('loanRate').value) / 100;

  const totalRevenue = lotSalePrice * totalLots;
  const totalCosts = devCost + softCost;
  const equity = totalCosts - loanAmount;

  const monthlyRate = loanRate / 12;
  const termMonths = Math.ceil(totalLots / monthlyAbsorption);
  const monthlyPayment = loanAmount > 0 ? loanAmount * monthlyRate : 0;

  let cumulativeRevenue = 0;
  let cumulativeCost = 0;
  let resultsHTML = `
    <table class="w-full border text-sm">
      <thead class="bg-blue-100"><tr>
        <th class="p-2">Month</th>
        <th class="p-2">Lots Sold</th>
        <th class="p-2">Revenue</th>
        <th class="p-2">Loan Interest</th>
        <th class="p-2">Cash Flow</th>
      </tr></thead><tbody>
  `;

  const chartLabels = [];
  const chartData = [];
  for (let month = 1; month <= termMonths; month++) {
    const lotsThisMonth = Math.min(monthlyAbsorption, totalLots - (month - 1) * monthlyAbsorption);
    const revenue = lotsThisMonth * lotSalePrice;
    const interest = monthlyPayment;
    const cashFlow = revenue - interest;
    cumulativeRevenue += revenue;
    cumulativeCost += interest;
    chartLabels.push(`M${month}`);
    chartData.push(cashFlow);
    resultsHTML += `<tr class="border-t">
      <td class="p-2">${month}</td>
      <td class="p-2">${lotsThisMonth}</td>
      <td class="p-2">$${revenue.toLocaleString()}</td>
      <td class="p-2">$${interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
      <td class="p-2">$${cashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
    </tr>`;
  }
  resultsHTML += '</tbody></table>';

  document.getElementById('results').innerHTML = `
    <div class="mb-4 text-lg font-semibold text-blue-700">Summary:</div>
    <ul class="mb-4 list-disc list-inside text-sm">
      <li>Total Revenue: $${totalRevenue.toLocaleString()}</li>
      <li>Total Development Costs: $${totalCosts.toLocaleString()}</li>
      <li>Estimated Interest Paid: $${(monthlyPayment * termMonths).toLocaleString()}</li>
      <li>Developer Equity: $${equity.toLocaleString()}</li>
    </ul>
    ${resultsHTML}
  `;

  const ctx = document.getElementById('resultsChart').getContext('2d');
  if (window.landChart) window.landChart.destroy();
  window.landChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'Monthly Cash Flow',
        data: chartData,
        fill: true,
        backgroundColor: 'rgba(59,130,246,0.1)',
        borderColor: '#3b82f6'
      }]
    }
  });
}

function exportToExcel() {
  const table = document.querySelector('#results table');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, 'LandProforma');
  XLSX.writeFile(wb, 'LandDevelopmentProforma.xlsx');
}

function autofillSample() {
  document.getElementById('projectName').value = "Summit Acres";
  document.getElementById('totalLots').value = 100;
  document.getElementById('lotSalePrice').value = "$120,000";
  document.getElementById('monthlyAbsorption').value = 10;
  document.getElementById('devCost').value = "$2,500,000";
  document.getElementById('softCost').value = "$500,000";
  document.getElementById('loanRate').value = 6;
  document.getElementById('loanAmount').value = "$2,000,000";
}
