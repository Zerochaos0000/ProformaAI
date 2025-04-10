// main.js - Mixed-Use Proforma with XLS Export and Multifamily/Retail Fix

document.getElementById('calculate').addEventListener('click', () => {
  const oneBedUnits = +document.getElementById('oneBedUnits').value || 0;
  const twoBedUnits = +document.getElementById('twoBedUnits').value || 0;
  const threeBedUnits = +document.getElementById('threeBedUnits').value || 0;
  const rent1Bed = +document.getElementById('rent1Bed').value || 0;
  const rent2Bed = +document.getElementById('rent2Bed').value || 0;
  const rent3Bed = +document.getElementById('rent3Bed').value || 0;

  const retailSqFt = +document.getElementById('retailSqFt').value || 0;
  const retailRate = +document.getElementById('retailRate').value || 0;

  const taxes = +document.getElementById('taxes').value || 0;
  const insurance = +document.getElementById('insurance').value || 0;
  const utilities = +document.getElementById('utilities').value || 0;
  const elevator = +document.getElementById('elevator').value || 0;
  const management = +document.getElementById('management').value || 0;
  const supplies = +document.getElementById('supplies').value || 0;
  const misc = +document.getElementById('misc').value || 0;
  const staff = +document.getElementById('staff').value || 0;
  const repairs = +document.getElementById('repairs').value || 0;

  const purchasePrice = +document.getElementById('purchasePrice').value || 0;
  const terminalCapRate = +document.getElementById('terminalCapRate').value || 0;
  const costOfSale = +document.getElementById('costOfSale').value || 0;

  const loanAmount = +document.getElementById('loanAmount').value || 0;
  const loanRate = +document.getElementById('loanRate').value / 100 || 0;
  const loanAmort = +document.getElementById('loanAmort').value || 30;

  // Income calculations
  const multifamilyIncome = ((oneBedUnits * rent1Bed) + (twoBedUnits * rent2Bed) + (threeBedUnits * rent3Bed)) * 12;
  const retailIncome = retailSqFt * retailRate;
  const grossIncome = multifamilyIncome + retailIncome;

  // Operating expenses
  const totalExpenses = taxes + insurance + utilities + elevator + management + supplies + misc + staff + repairs;

  // Debt Service calculation
  const monthlyRate = loanRate / 12;
  const termMonths = loanAmort * 12;
  const monthlyDebtService = loanAmount > 0 ? (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths)) : 0;
  const annualDebtService = monthlyDebtService * 12;

  const noi = grossIncome - totalExpenses;
  const cashFlowBeforeTax = noi - annualDebtService;

  // Render output
  const results = `
    <div class="mt-4 text-sm">
      <h3 class="text-xl font-semibold text-gray-800 mb-2">Results Summary</h3>
      <p><strong>Total Multifamily Income:</strong> $${multifamilyIncome.toLocaleString()}</p>
      <p><strong>Total Retail Income:</strong> $${retailIncome.toLocaleString()}</p>
      <p><strong>Total Gross Income:</strong> $${grossIncome.toLocaleString()}</p>
      <p><strong>Operating Expenses:</strong> $${totalExpenses.toLocaleString()}</p>
      <p><strong>Net Operating Income (NOI):</strong> $${noi.toLocaleString()}</p>
      <p><strong>Annual Debt Service:</strong> $${annualDebtService.toLocaleString()}</p>
      <p><strong>Cash Flow Before Tax:</strong> $${cashFlowBeforeTax.toLocaleString()}</p>
    </div>
  `;
  document.getElementById('results').innerHTML = results;

  // Chart update
  const ctx = document.getElementById('resultsChart').getContext('2d');
  if (window.incomeChart) window.incomeChart.destroy();
  window.incomeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Multifamily Income', 'Retail Income', 'Expenses', 'Debt Service', 'Cash Flow'],
      datasets: [{
        label: 'Amount ($)',
        data: [multifamilyIncome, retailIncome, totalExpenses, annualDebtService, cashFlowBeforeTax],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
});

// XLS Export

document.getElementById('exportPdf').insertAdjacentHTML('afterend', `
  <button id="exportXls" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 ml-2">📁 Export to Excel</button>
`);

document.addEventListener('click', function (e) {
  if (e.target && e.target.id === 'exportXls') {
    const data = [
      ['Metric', 'Amount ($)'],
      ['Multifamily Income', multifamilyIncome],
      ['Retail Income', retailIncome],
      ['Gross Income', grossIncome],
      ['Operating Expenses', totalExpenses],
      ['Net Operating Income (NOI)', noi],
      ['Annual Debt Service', annualDebtService],
      ['Cash Flow Before Tax', cashFlowBeforeTax],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'MixedUse Proforma');
    XLSX.writeFile(wb, 'MixedUse_Proforma.xlsx');
  }
});
