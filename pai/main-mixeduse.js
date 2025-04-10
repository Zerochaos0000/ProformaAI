// main.js - Mixed-Use Proforma Calculation Logic

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

  // Income
  const annualMultifamilyIncome = (oneBedUnits * rent1Bed + twoBedUnits * rent2Bed + threeBedUnits * rent3Bed) * 12;
  const annualRetailIncome = retailSqFt * retailRate;
  const grossIncome = annualMultifamilyIncome + annualRetailIncome;

  // Expenses
  const totalExpenses = taxes + insurance + utilities + elevator + management + supplies + misc + staff + repairs;

  // Debt Service Calculation (Simple Amortized Loan)
  const monthlyInterest = loanRate / 12;
  const totalMonths = loanAmort * 12;
  const monthlyDebtService = loanAmount * monthlyInterest / (1 - Math.pow(1 + monthlyInterest, -totalMonths));
  const annualDebtService = monthlyDebtService * 12;

  const noi = grossIncome - totalExpenses;
  const cashFlowBeforeTax = noi - annualDebtService;

  const results = `
    <div class="mt-4 text-sm">
      <h3 class="text-xl font-semibold text-gray-800 mb-2">Results Summary</h3>
      <p><strong>Total Multifamily Income:</strong> $${annualMultifamilyIncome.toLocaleString()}</p>
      <p><strong>Total Retail Income:</strong> $${annualRetailIncome.toLocaleString()}</p>
      <p><strong>Total Gross Income:</strong> $${grossIncome.toLocaleString()}</p>
      <p><strong>Operating Expenses:</strong> $${totalExpenses.toLocaleString()}</p>
      <p><strong>Net Operating Income (NOI):</strong> $${noi.toLocaleString()}</p>
      <p><strong>Annual Debt Service:</strong> $${annualDebtService.toLocaleString()}</p>
      <p><strong>Cash Flow Before Tax:</strong> $${cashFlowBeforeTax.toLocaleString()}</p>
    </div>
  `;

  document.getElementById('results').innerHTML = results;

  const ctx = document.getElementById('resultsChart').getContext('2d');
  if (window.incomeChart) window.incomeChart.destroy();
  window.incomeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Multifamily Income', 'Retail Income', 'Expenses', 'Debt Service', 'Cash Flow'],
      datasets: [{
        label: 'Amount ($)',
        data: [annualMultifamilyIncome, annualRetailIncome, totalExpenses, annualDebtService, cashFlowBeforeTax],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
});
