document.getElementById('calculate').addEventListener('click', calculateProforma);
document.getElementById('exportPdf').addEventListener('click', () => window.print());
document.getElementById('exportXls').addEventListener('click', exportToExcel);
document.getElementById('autofillDemo').addEventListener('click', autofillDemo);
document.getElementById('resetInputs').addEventListener('click', resetInputs);

function parseCurrency(val) {
  return Number(val.replace(/[^0-9.-]+/g,"")) || 0;
}

function calculateProforma() {
  // Income Inputs
  const units = [
    {count: parseCurrency(document.getElementById('oneBedUnits').value), rent: parseCurrency(document.getElementById('rent1Bed').value)},
    {count: parseCurrency(document.getElementById('twoBedUnits').value), rent: parseCurrency(document.getElementById('rent2Bed').value)},
    {count: parseCurrency(document.getElementById('threeBedUnits').value), rent: parseCurrency(document.getElementById('rent3Bed').value)}
  ];
  const otherIncome = parseCurrency(document.getElementById('otherIncome').value);
  const vacancyRate = parseFloat(document.getElementById('vacancyRate').value) / 100;

  const grossPotentialRent = units.reduce((sum, u) => sum + (u.count * u.rent * 12), 0);
  const vacancyLoss = grossPotentialRent * vacancyRate;
  const effectiveGrossIncome = grossPotentialRent + otherIncome - vacancyLoss;

  // Operating Expenses
  const expenses = ['propertyTaxes','insurance','utilities','maintenance','management','supplies','staff','misc']
    .map(id => parseCurrency(document.getElementById(id).value));
  const totalExpenses = expenses.reduce((a,b) => a + b, 0);

  const NOI = effectiveGrossIncome - totalExpenses;

  // Loan Calculations
  const loanAmount = parseCurrency(document.getElementById('loanAmount').value);
  const interestRate = parseFloat(document.getElementById('interestRate').value) / 100;
  const loanTerm = parseInt(document.getElementById('loanTerm').value);
  const monthlyRate = interestRate / 12;
  const monthlyPayment = loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -loanTerm * 12));
  const annualDebtService = monthlyPayment * 12;

  const cashFlowBeforeTax = NOI - annualDebtService;

  // Investment Metrics
  const purchasePrice = parseCurrency(document.getElementById('purchasePrice').value);
  const initialEquity = purchasePrice - loanAmount;
  const cashOnCash = (cashFlowBeforeTax / initialEquity) * 100;

  // Results Table
  const resultsHTML = `
    <table class="w-full text-left border-collapse">
      <tr><td>Total Potential Rent</td><td>$${grossPotentialRent.toLocaleString()}</td></tr>
      <tr><td>Vacancy Loss</td><td>$${vacancyLoss.toLocaleString()}</td></tr>
      <tr><td>Effective Gross Income</td><td>$${effectiveGrossIncome.toLocaleString()}</td></tr>
      <tr><td>Operating Expenses</td><td>$${totalExpenses.toLocaleString()}</td></tr>
      <tr><td>Net Operating Income (NOI)</td><td>$${NOI.toLocaleString()}</td></tr>
      <tr><td>Annual Debt Service</td><td>$${annualDebtService.toLocaleString()}</td></tr>
      <tr class="font-bold"><td>Cash Flow Before Tax</td><td>$${cashFlowBeforeTax.toLocaleString()}</td></tr>
      <tr><td>Cash-on-Cash Return</td><td>${cashOnCash.toFixed(2)}%</td></tr>
    </table>`;

  document.getElementById('results').innerHTML = resultsHTML;

  renderCharts(effectiveGrossIncome, NOI, totalExpenses);
  render5YearProforma(effectiveGrossIncome, totalExpenses, annualDebtService);
}

function renderCharts(egi, noi, expenses) {
  const incomeCtx = document.getElementById('incomeChart').getContext('2d');
  const expenseCtx = document.getElementById('expenseChart').getContext('2d');
  new Chart(incomeCtx, {
    type: 'bar',
    data: {
      labels: ['EGI', 'NOI'],
      datasets: [{ data: [egi, noi], backgroundColor: ['#3b82f6','#22c55e'] }]
    }
  });
  new Chart(expenseCtx, {
    type: 'pie',
    data: {
      labels: ['Expenses', 'NOI'],
      datasets: [{ data: [expenses, noi], backgroundColor: ['#ef4444','#22c55e'] }]
    }
  });
}

function render5YearProforma(income, expenses, debtService) {
  let table = '<table class="w-full text-left"><tr><th>Year</th><th>Income</th><th>Expenses</th><th>NOI</th><th>Debt Service</th><th>Cash Flow</th></tr>';
  for(let y=1; y<=5; y++){
    let growth = Math.pow(1.02, y-1);
    let yearlyIncome = income * growth;
    let yearlyExpenses = expenses * growth;
    let yearlyNOI = yearlyIncome - yearlyExpenses;
    let cashFlow = yearlyNOI - debtService;
    table += `<tr><td>${y}</td><td>$${yearlyIncome.toFixed(0)}</td><td>$${yearlyExpenses.toFixed(0)}</td><td>$${yearlyNOI.toFixed(0)}</td><td>$${debtService.toFixed(0)}</td><td>$${cashFlow.toFixed(0)}</td></tr>`;
  }
  table += '</table>';
  document.getElementById('fiveYearTable').innerHTML = table;
}

function exportToExcel() {
  const workbook = XLSX.utils.book_new();

  // Title Sheet
  const titleSheet = XLSX.utils.aoa_to_sheet([
    ["REProforma Multifamily Acquisition Model"],
    ["Generated:", new Date().toLocaleString()],
    []
  ]);
  XLSX.utils.book_append_sheet(workbook, titleSheet, "Cover");

  // Input Sheet
  const inputs = [
    ["Input Category", "Field", "Value"],
    ["Unit Mix", "1-Bed Units", document.getElementById('oneBedUnits').value],
    ["Unit Mix", "2-Bed Units", document.getElementById('twoBedUnits').value],
    ["Unit Mix", "3-Bed Units", document.getElementById('threeBedUnits').value],
    ["Unit Mix", "Rent per 1-Bed", document.getElementById('rent1Bed').value],
    ["Unit Mix", "Rent per 2-Bed", document.getElementById('rent2Bed').value],
    ["Unit Mix", "Rent per 3-Bed", document.getElementById('rent3Bed').value],
    ["Income", "Other Income", document.getElementById('otherIncome').value],
    ["Income", "Vacancy Rate (%)", document.getElementById('vacancyRate').value],
    ["Expenses", "Property Taxes", document.getElementById('propertyTaxes').value],
    ["Expenses", "Insurance", document.getElementById('insurance').value],
    ["Expenses", "Utilities", document.getElementById('utilities').value],
    ["Expenses", "Maintenance", document.getElementById('maintenance').value],
    ["Expenses", "Management", document.getElementById('management').value],
    ["Expenses", "Supplies", document.getElementById('supplies').value],
    ["Expenses", "Staff", document.getElementById('staff').value],
    ["Expenses", "Misc & Reserves", document.getElementById('misc').value],
    ["Financing", "Purchase Price", document.getElementById('purchasePrice').value],
    ["Financing", "Loan Amount", document.getElementById('loanAmount').value],
    ["Financing", "Interest Rate (%)", document.getElementById('interestRate').value],
    ["Financing", "Loan Term", document.getElementById('loanTerm').value],
  ];

  const inputSheet = XLSX.utils.aoa_to_sheet(inputs);
  XLSX.utils.book_append_sheet(workbook, inputSheet, 'Inputs');

  // Summary Table
  const resultsTable = document.getElementById('results').querySelector('table');
  if (resultsTable) {
    const resultSheet = XLSX.utils.table_to_sheet(resultsTable);
    XLSX.utils.book_append_sheet(workbook, resultSheet, 'Summary');
  }

  // 5-Year Table
  const yearTable = document.getElementById('fiveYearTable').querySelector('table');
  if (yearTable) {
    const yearSheet = XLSX.utils.table_to_sheet(yearTable);
    XLSX.utils.book_append_sheet(workbook, yearSheet, '5-Year Projection');
  }

  // Decision Note Logic
  const purchasePrice = parseFloat(document.getElementById('purchasePrice').value);
  const loanAmount = parseFloat(document.getElementById('loanAmount').value);
  const equity = purchasePrice - loanAmount;
  const noi = parseFloat(document.getElementById('results').innerText.match(/Net Operating Income \(NOI\)\s+\$([\d,]+)/)?.[1].replace(/,/g, "") || 0);
  const debtService = parseFloat(document.getElementById('results').innerText.match(/Annual Debt Service\s+\$([\d,]+)/)?.[1].replace(/,/g, "") || 0);
  const cashFlow = noi - debtService;
  const cocReturn = ((cashFlow / equity) * 100).toFixed(2);

  const decision = cocReturn >= 12
    ? "✅ This appears to be a strong investment opportunity."
    : "⚠️ Consider revising your assumptions or evaluating further.";

  const decisionSheet = XLSX.utils.aoa_to_sheet([["Decision Summary"], ["Cash-on-Cash Return", cocReturn + "%"], [decision]]);
  XLSX.utils.book_append_sheet(workbook, decisionSheet, 'Investment Decision');

  // Save
  XLSX.writeFile(workbook, 'Multifamily_Proforma_Styled.xlsx');
}
// Reset all input fields
function resetInputs() {
  document.querySelectorAll('input').forEach(input => input.value = '');
}

// Autofill Demo Inputs
function autofillDemo() {
  document.getElementById('oneBedUnits').value = 20;
  document.getElementById('rent1Bed').value = 1200;
  document.getElementById('twoBedUnits').value = 35;
  document.getElementById('rent2Bed').value = 1500;
  document.getElementById('threeBedUnits').value = 15;
  document.getElementById('rent3Bed').value = 1800;

  document.getElementById('otherIncome').value = 25000;
  document.getElementById('vacancyRate').value = 5;

  document.getElementById('propertyTaxes').value = 40000;
  document.getElementById('insurance').value = 12000;
  document.getElementById('utilities').value = 25000;
  document.getElementById('maintenance').value = 15000;
  document.getElementById('management').value = 20000;
  document.getElementById('supplies').value = 5000;
  document.getElementById('staff').value = 30000;
  document.getElementById('misc').value = 8000;

  document.getElementById('purchasePrice').value = 5000000;
  document.getElementById('loanAmount').value = 3500000;
  document.getElementById('interestRate').value = 5;
  document.getElementById('loanTerm').value = 25;
}
