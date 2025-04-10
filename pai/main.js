// main-multifamily.js

document.getElementById('calculate').addEventListener('click', calculateProforma);
document.getElementById('exportPdf').addEventListener('click', exportToPDF);
document.getElementById('exportXls').addEventListener('click', exportToExcel);
document.getElementById('autofillDemo')?.addEventListener('click', autofillSample);

function parseCurrency(val) {
  if (typeof val !== "string") return +val || 0;
  return +val.replace(/[^0-9.-]+/g, "") || 0;
}

function calculateProforma() {
  const oneBedUnits = parseCurrency(document.getElementById('oneBedUnits').value);
  const twoBedUnits = parseCurrency(document.getElementById('twoBedUnits').value);
  const threeBedUnits = parseCurrency(document.getElementById('threeBedUnits').value);
  const rent1Bed = parseCurrency(document.getElementById('rent1Bed').value);
  const rent2Bed = parseCurrency(document.getElementById('rent2Bed').value);
  const rent3Bed = parseCurrency(document.getElementById('rent3Bed').value);

  const expensesBreakdown = ['taxes', 'insurance', 'utilities', 'maintenance', 'management', 'supplies', 'misc', 'staff', 'repairs']
    .map(id => parseCurrency(document.getElementById(id).value));
  const expenseLabels = ['Taxes', 'Insurance', 'Utilities', 'Maintenance', 'Management', 'Supplies', 'Misc', 'Staff', 'Repairs'];
  const expenses = expensesBreakdown.reduce((sum, val) => sum + val, 0);

  const loanAmount = parseCurrency(document.getElementById('loanAmount').value);
  const loanRate = parseCurrency(document.getElementById('loanRate').value) / 100;
  const loanAmort = parseCurrency(document.getElementById('loanAmort').value) || 30;

  const monthlyRate = loanRate / 12;
  const numPayments = loanAmort * 12;
  const annualDebtService = loanAmount > 0 ? 
    Math.round((loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments))) * 12) : 0;

  const multifamilyIncome = (oneBedUnits * rent1Bed + twoBedUnits * rent2Bed + threeBedUnits * rent3Bed) * 12;
  const totalIncome = multifamilyIncome;
  const noi = totalIncome - expenses;
  const cashFlow = noi - annualDebtService;

  const purchasePrice = parseCurrency(document.getElementById('purchasePrice')?.value);
  const irrEstimate = ((cashFlow / purchasePrice) * 100).toFixed(2);
  const cashOnCash = ((cashFlow / (purchasePrice - loanAmount)) * 100).toFixed(2);
  const equityMultiple = ((cashFlow * 5) / (purchasePrice - loanAmount)).toFixed(2);

  const capRate = parseCurrency(document.getElementById('terminalCapRate')?.value) / 100 || 0.06;
  const costOfSale = parseCurrency(document.getElementById('costOfSale')?.value) / 100 || 0.06;
  const refinanceValue = (noi * Math.pow(1.02, 5)) / capRate;
  const saleProceeds = refinanceValue - (refinanceValue * costOfSale) - loanAmount;

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
        <tr><td class="px-4 py-2">Operating Expenses</td><td class="px-4 py-2">$${expenses.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2 font-semibold">Net Operating Income (NOI)</td><td class="px-4 py-2 font-semibold">$${noi.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Annual Debt Service</td><td class="px-4 py-2">$${annualDebtService.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2 font-bold text-blue-700">Cash Flow Before Tax</td><td class="px-4 py-2 font-bold text-blue-700">$${cashFlow.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Estimated IRR (Year 1)</td><td class="px-4 py-2">${irrEstimate}%</td></tr>
        <tr><td class="px-4 py-2">Cash-on-Cash Return</td><td class="px-4 py-2">${cashOnCash}%</td></tr>
        <tr><td class="px-4 py-2">Equity Multiple (5 Yr)</td><td class="px-4 py-2">${equityMultiple}x</td></tr>
        <tr><td class="px-4 py-2 text-green-700">Refinance Value (Year 5)</td><td class="px-4 py-2">$${refinanceValue.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Estimated Net Sale Proceeds</td><td class="px-4 py-2">$${saleProceeds.toLocaleString()}</td></tr>
      </tbody>
    </table>
    ${investmentNote}
  `;

  document.getElementById('results').innerHTML = resultsTable;
  renderProformaChart([multifamilyIncome], ['Multifamily']);
  renderProformaTable(totalIncome, expenses, noi, annualDebtService);
  renderExpensePieChart(expensesBreakdown, expenseLabels);
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
        backgroundColor: ['#3b82f6']
      }]
    }
  });
}

function renderExpensePieChart(data, labels) {
  const ctx = document.getElementById('expensesChart').getContext('2d');
  if (window.expenseChart) window.expenseChart.destroy();
  window.expenseChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Expense Breakdown',
        data: data,
        backgroundColor: [
          '#f87171','#facc15','#34d399','#60a5fa','#a78bfa','#f472b6','#fb923c','#4ade80','#c084fc'
        ]
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
      <td class="px-4 py-2">$${yearlyIncome.toLocaleString()}</td>
      <td class="px-4 py-2">$${yearlyExpenses.toLocaleString()}</td>
      <td class="px-4 py-2">$${yearlyNOI.toLocaleString()}</td>
      <td class="px-4 py-2">$${debt.toLocaleString()}</td>
      <td class="px-4 py-2">$${yearlyCashFlow.toLocaleString()}</td>
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
  XLSX.writeFile(wb, 'MultifamilyProforma.xlsx');
}

function autofillSample() {
  document.getElementById('oneBedUnits').value = "50";
  document.getElementById('twoBedUnits').value = "60";
  document.getElementById('threeBedUnits').value = "30";
  document.getElementById('rent1Bed').value = "$1,200";
  document.getElementById('rent2Bed').value = "$1,600";
  document.getElementById('rent3Bed').value = "$2,000";
  document.getElementById('loanAmount').value = "$7,000,000";
  document.getElementById('loanRate').value = "5";
  document.getElementById('loanAmort').value = "30";
  document.getElementById('purchasePrice').value = "$10,000,000";
  document.getElementById('terminalCapRate').value = "5";
  document.getElementById('costOfSale').value = "6";
  ['taxes','insurance','utilities','maintenance','management','supplies','misc','staff','repairs'].forEach(id => {
    document.getElementById(id).value = "$100,000";
  });
}
