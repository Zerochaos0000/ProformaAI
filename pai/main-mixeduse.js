// main.js

document.getElementById('calculate').addEventListener('click', calculateProforma);
document.getElementById('exportPdf').addEventListener('click', exportToPDF);
document.getElementById('exportXls').addEventListener('click', exportToExcel);

function calculateProforma() {
  const oneBedUnits = +document.getElementById('oneBedUnits').value || 0;
  const twoBedUnits = +document.getElementById('twoBedUnits').value || 0;
  const threeBedUnits = +document.getElementById('threeBedUnits').value || 0;
  const rent1Bed = +document.getElementById('rent1Bed').value || 0;
  const rent2Bed = +document.getElementById('rent2Bed').value || 0;
  const rent3Bed = +document.getElementById('rent3Bed').value || 0;
  const retailSqFt = +document.getElementById('retailSqFt').value || 0;
  const retailRate = +document.getElementById('retailRate').value || 0;

  const expenses = ['taxes', 'insurance', 'utilities', 'elevator', 'management', 'supplies', 'misc', 'staff', 'repairs'].reduce((sum, id) => {
    return sum + (+document.getElementById(id).value || 0);
  }, 0);

  const loanAmount = +document.getElementById('loanAmount').value || 0;
  const loanRate = +document.getElementById('loanRate').value / 100 || 0;
  const loanAmort = +document.getElementById('loanAmort').value || 30;

  const monthlyRate = loanRate / 12;
  const numPayments = loanAmort * 12;
  const annualDebtService = loanAmount > 0 ? (loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments))) * 12 : 0;

  const multifamilyIncome = (oneBedUnits * rent1Bed + twoBedUnits * rent2Bed + threeBedUnits * rent3Bed) * 12;
  const retailIncome = retailSqFt * retailRate;
  const totalIncome = multifamilyIncome + retailIncome;
  const noi = totalIncome - expenses;
  const cashFlow = noi - annualDebtService;

  // Additional Metrics
  const purchasePrice = +document.getElementById('purchasePrice')?.value || 0;
  const irrEstimate = ((cashFlow / purchasePrice) * 100).toFixed(2);
  const cashOnCash = ((cashFlow / (purchasePrice - loanAmount)) * 100).toFixed(2);
  const equityMultiple = (cashFlow * 5) / (purchasePrice - loanAmount);

  // Decision Logic
  let investmentNote = '';
  if (irrEstimate > 12 && equityMultiple > 1.5 && cashOnCash > 8) {
    investmentNote = `<p class='mt-4 text-green-700 font-bold'>✅ This appears to be a strong investment opportunity based on your metrics.</p>`;
  } else {
    investmentNote = `<p class='mt-4 text-red-600 font-bold'>⚠️ Caution: Investment returns are moderate or below expectations.</p>`;
  }

  const resultsTable = `
    <table class="w-full text-sm text-left border border-gray-300">
      <thead class="bg-blue-100">
        <tr><th class="px-4 py-2">Metric</th><th class="px-4 py-2">Value</th></tr>
      </thead>
      <tbody>
        <tr><td class="px-4 py-2">Total Multifamily Income</td><td class="px-4 py-2">$${multifamilyIncome.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Total Retail Income</td><td class="px-4 py-2">$${retailIncome.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2 font-semibold">Total Gross Income</td><td class="px-4 py-2 font-semibold">$${totalIncome.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Operating Expenses</td><td class="px-4 py-2">$${expenses.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2 font-semibold">Net Operating Income (NOI)</td><td class="px-4 py-2 font-semibold">$${noi.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Annual Debt Service</td><td class="px-4 py-2">$${annualDebtService.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2 font-bold text-blue-700">Cash Flow Before Tax</td><td class="px-4 py-2 font-bold text-blue-700">$${cashFlow.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Estimated IRR (Year 1)</td><td class="px-4 py-2">${irrEstimate}%</td></tr>
        <tr><td class="px-4 py-2">Cash-on-Cash Return</td><td class="px-4 py-2">${cashOnCash}%</td></tr>
        <tr><td class="px-4 py-2">Equity Multiple (5 Yr)</td><td class="px-4 py-2">${equityMultiple.toFixed(2)}x</td></tr>
      </tbody>
    </table>
    ${investmentNote}
  `;

  document.getElementById('results').innerHTML = resultsTable;

  renderProformaChart([multifamilyIncome, retailIncome], ['Multifamily', 'Retail']);
  renderProformaTable(totalIncome, expenses, noi, annualDebtService);
}

function renderProformaChart(data, labels) {
  const ctx = document.getElementById('resultsChart').getContext('2d');
  if (window.chartInstance) window.chartInstance.destroy();
  window.chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Annual Income by Source',
        data: data,
        backgroundColor: ['#3b82f6', '#10b981']
      }]
    }
  });
}

function renderProformaTable(income, expenses, noi, debt) {
  const table = document.getElementById('proformaTable');
  let html = '<table class="min-w-full text-sm text-left"><thead><tr class="bg-blue-100">';
  html += '<th class="px-4 py-2">Year</th><th class="px-4 py-2">Income</th><th class="px-4 py-2">Expenses</th><th class="px-4 py-2">NOI</th><th class="px-4 py-2">Debt Service</th><th class="px-4 py-2">Cash Flow</th></tr></thead><tbody>';
  for (let i = 1; i <= 5; i++) {
    const inflator = 1 + (i * 0.02);
    const yearlyIncome = income * inflator;
    const yearlyExpenses = expenses * inflator;
    const yearlyNOI = yearlyIncome - yearlyExpenses;
    const yearlyCashFlow = yearlyNOI - debt;
    html += `<tr class="border-t">
      <td class="px-4 py-2">Year ${i}</td>
      <td class="px-4 py-2">$${yearlyIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
      <td class="px-4 py-2">$${yearlyExpenses.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
      <td class="px-4 py-2">$${yearlyNOI.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
      <td class="px-4 py-2">$${debt.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
      <td class="px-4 py-2">$${yearlyCashFlow.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
    </tr>`;
  }
  html += '</tbody></table>';
  table.innerHTML = html;
}

function exportToPDF() {
  window.print();
}

function exportToExcel() {
  const ws = XLSX.utils.table_to_sheet(document.querySelector('#proformaTable table'));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Proforma');
  XLSX.writeFile(wb, 'ProformaOutput.xlsx');
}
