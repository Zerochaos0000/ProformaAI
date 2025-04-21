document.getElementById('calculate').addEventListener('click', calculateProforma);
document.getElementById('exportPdf').addEventListener('click', exportToPDF);
document.getElementById('exportXls').addEventListener('click', exportToExcel);
document.getElementById('autofillDemo').addEventListener('click', autofillDemo);

function parseCurrency(value) {
  if (typeof value !== "string") return +value || 0;
  return +value.replace(/[^0-9.-]+/g, "") || 0;
}

function calculateProforma() {
  const numLots = parseCurrency(document.getElementById('numLots').value);
  const lotPrice = parseCurrency(document.getElementById('lotPrice').value);
  const landCost = parseCurrency(document.getElementById('landCost').value);
  const devCost = parseCurrency(document.getElementById('devCost').value);
  const otherCost = parseCurrency(document.getElementById('otherCost').value);

  const loanAmount = parseCurrency(document.getElementById('loanAmount').value);
  const interestRate = parseCurrency(document.getElementById('interestRate').value) / 100;
  const amortYears = parseCurrency(document.getElementById('amortYears').value);

  const grossRevenue = numLots * lotPrice;
  const totalCosts = landCost + devCost + otherCost;

  const monthlyRate = interestRate / 12;
  const numPayments = amortYears * 12;

  const annualDebtService = loanAmount > 0
    ? (loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments))) * 12
    : 0;

  const netProfit = grossRevenue - totalCosts - annualDebtService;

  const resultsHTML = `
    <table class="w-full text-sm text-left border border-gray-300">
      <thead class="bg-blue-100">
        <tr><th class="px-4 py-2">Metric</th><th class="px-4 py-2">Value</th></tr>
      </thead>
      <tbody>
        <tr><td class="px-4 py-2">Total Lots</td><td class="px-4 py-2">${numLots}</td></tr>
        <tr><td class="px-4 py-2">Gross Revenue</td><td class="px-4 py-2">$${grossRevenue.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Land Cost</td><td class="px-4 py-2">$${landCost.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Development Cost</td><td class="px-4 py-2">$${devCost.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Other Costs</td><td class="px-4 py-2">$${otherCost.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Annual Debt Service</td><td class="px-4 py-2">$${annualDebtService.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td></tr>
        <tr class="font-bold text-green-700"><td class="px-4 py-2">Net Profit</td><td class="px-4 py-2">$${netProfit.toLocaleString()}</td></tr>
      </tbody>
    </table>
  `;

function autofillDemo() {
  const tenants = [
    ["Starbucks", 2000, 45],
    ["Verizon", 3500, 42],
    ["Chase Bank", 4200, 50]
  ];
  
  document.getElementById('results').innerHTML = resultsHTML;

  renderProformaTable(grossRevenue, totalCosts, annualDebtService);
  renderBarChart([grossRevenue, totalCosts, annualDebtService], ['Revenue', 'Costs', 'Debt']);
}

function renderProformaTable(revenue, costs, debt) {
  const container = document.getElementById('proformaTable');
  let html = `
    <table class="min-w-full text-sm text-left border mt-4">
      <thead class="bg-blue-100">
        <tr>
          <th class="px-4 py-2">Year</th>
          <th class="px-4 py-2">Revenue</th>
          <th class="px-4 py-2">Costs</th>
          <th class="px-4 py-2">Debt</th>
          <th class="px-4 py-2">Net</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (let i = 1; i <= 5; i++) {
    const inflator = 1 + (i * 0.02);
    const rev = revenue * inflator;
    const exp = costs * inflator;
    const net = rev - exp - debt;
    html += `<tr>
      <td class="px-4 py-2">Year ${i}</td>
      <td class="px-4 py-2">$${rev.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
      <td class="px-4 py-2">$${exp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
      <td class="px-4 py-2">$${debt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
      <td class="px-4 py-2 font-semibold text-green-700">$${net.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
    </tr>`;
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

function renderBarChart(data, labels) {
  const ctx = document.getElementById('chart').getContext('2d');
  if (window.chartInstance) window.chartInstance.destroy();
  window.chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Financial Breakdown',
        data: data,
        backgroundColor: ['#3b82f6', '#f87171', '#a78bfa']
      }]
    }
  });
}

function exportToPDF() {
  window.print();
}

function exportToExcel() {
  const table = document.querySelector('#proformaTable table');
  if (!table) return;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, 'Land Proforma');
  XLSX.writeFile(wb, 'Land_Development_Proforma.xlsx');
}
