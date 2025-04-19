document.addEventListener('DOMContentLoaded', function () {
document.getElementById('calculate').addEventListener('click', calculateProforma);
document.getElementById('exportPdf').addEventListener('click', () => window.print());
document.getElementById('exportXls').addEventListener('click', exportToExcel);
document.getElementById('autofillDemo').addEventListener('click', autofillDemo);
document.getElementById('resetInputs').addEventListener('click', resetInputs);

function parseCurrency(val) {
  return Number(val.replace(/[^0-9.-]+/g, "")) || 0;
}

let decisionText = '';


function calculateProforma() {
  const otherIncome = parseCurrency(document.getElementById('otherIncome').value);
  const vacancyRate = parseFloat(document.getElementById('vacancyRate').value) / 100;  const grossPotentialRent = getTenantBaseRent();
  const vacancyLoss = grossPotentialRent * vacancyRate;
  const effectiveGrossIncome = grossPotentialRent + otherIncome - vacancyLoss;

  const expenses = ['propertyTaxes','insurance','utilities','maintenance','management','supplies','staff','misc']
    .map(id => parseCurrency(document.getElementById(id).value));
  const totalExpenses = expenses.reduce((a, b) => a + b, 0);
  const NOI = effectiveGrossIncome - totalExpenses;

  const loanAmount = parseCurrency(document.getElementById('loanAmount').value);
  const interestRate = parseFloat(document.getElementById('interestRate').value) / 100;
  const loanTerm = parseInt(document.getElementById('loanTerm').value);
  const monthlyRate = interestRate / 12;
  const monthlyPayment = loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -loanTerm * 12));
  const annualDebtService = monthlyPayment * 12;

  const purchasePrice = parseCurrency(document.getElementById('purchasePrice').value);
  const initialEquity = purchasePrice - loanAmount;
  const cashFlowBeforeTax = NOI - annualDebtService;
  const cashOnCash = (cashFlowBeforeTax / initialEquity) * 100;

  let decisionText = '';
  if (cashOnCash >= 12) {
    decisionText = `✅ This appears to be a strong investment opportunity (CoC: ${Math.round(cashOnCash)}%)`;
  } else if (cashOnCash >= 8) {
    decisionText = `⚠️ Moderate returns. Consider refining assumptions (CoC: ${Math.round(cashOnCash)}%)`;
  } else {
    decisionText = `❌ Low investment return. Proceed with caution (CoC: ${Math.round(cashOnCash)}%)`;
  }

  const capRate = (NOI / purchasePrice) * 100;
  const exitCapRate = 0.06;
  const salePrice = NOI * (1 / exitCapRate);
  const totalPayments = loanTerm * 12;
  const paymentsMade = 5 * 12;
  const remainingBalance = loanAmount * (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, paymentsMade)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
  const netSaleProceeds = salePrice - remainingBalance;
  const yearlyCashFlows = Array(4).fill(cashFlowBeforeTax);
  yearlyCashFlows.push(cashFlowBeforeTax + netSaleProceeds);
  const irrCashFlows = [-initialEquity, ...yearlyCashFlows];

  function calculateIRR(cashFlows) {
    let rate = 0.12;
    const maxIter = 100;
    const eps = 1e-6;
    for (let i = 0; i < maxIter; i++) {
      let npv = 0;
      let derivative = 0;
      for (let t = 0; t < cashFlows.length; t++) {
        const denom = Math.pow(1 + rate, t);
        npv += cashFlows[t] / denom;
        if (t > 0) {
          derivative -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
        }
      }
      const newRate = rate - npv / derivative;
      if (Math.abs(newRate - rate) < eps) break;
      rate = newRate;
    }
    return rate * 100;
  }

  const irr = calculateIRR(irrCashFlows);

  const resultsHTML = `
    <table class="w-full text-left border-collapse">
      <tr><td>Total Potential Rent</td><td>$${grossPotentialRent.toLocaleString()}</td></tr>
      <tr><td>Vacancy Loss</td><td>$${vacancyLoss.toLocaleString()}</td></tr>
      <tr><td>Effective Gross Income</td><td>$${effectiveGrossIncome.toLocaleString()}</td></tr>
      <tr><td>Operating Expenses</td><td>$${totalExpenses.toLocaleString()}</td></tr>
      <tr><td>Net Operating Income (NOI)</td><td>$${NOI.toLocaleString()}</td></tr>
      <tr><td>Annual Debt Service</td><td>$${Math.round(annualDebtService).toLocaleString()}</td></tr>
      <tr class="font-bold"><td>Cash Flow Before Tax</td><td>$${Math.round(cashFlowBeforeTax).toLocaleString()}</td></tr>
      <tr><td>Cash-on-Cash Return</td><td>${Math.round(cashOnCash)}%</td></tr>
      <tr><td>Cap Rate</td><td>${Math.round(capRate)}%</td></tr>
      <tr><td>Estimated IRR</td><td>${Math.round(irr)}%</td></tr>
    </table>
    <p class="mt-4 font-semibold">${decisionText}</p>
  `;

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
  for(let y = 1; y <= 5; y++) {
    let growth = Math.pow(1.02, y - 1);
    let yearlyIncome = income * growth;
    let yearlyExpenses = expenses * growth;
    let yearlyNOI = yearlyIncome - yearlyExpenses;
    let cashFlow = yearlyNOI - debtService;
    table += `<tr><td>${y}</td><td>$${Math.round(yearlyIncome).toLocaleString()}</td><td>$${Math.round(yearlyExpenses).toLocaleString()}</td><td>$${Math.round(yearlyNOI).toLocaleString()}</td><td>$${Math.round(debtService).toLocaleString()}</td><td>$${Math.round(cashFlow).toLocaleString()}</td></tr>`;
  }
  table += "</table>";
  document.getElementById('fiveYearTable').innerHTML = table;
}

function exportToExcel() {
  const wb = XLSX.utils.book_new();

  // Title
  const title = [["REProforma - Multifamily Acquisition Proforma"]];
  const spacer = [[""]];

  const inputData = [
    ["Category", "Field", "Value"],    spacer[0],
    ["Income", "Other Income", document.getElementById('otherIncome').value],
    ["Income", "Vacancy Rate (%)", document.getElementById('vacancyRate').value],
    spacer[0],
    ["Expenses", "Property Taxes", document.getElementById('propertyTaxes').value],
    ["Expenses", "Insurance", document.getElementById('insurance').value],
    ["Expenses", "Utilities", document.getElementById('utilities').value],
    ["Expenses", "Maintenance", document.getElementById('maintenance').value],
    ["Expenses", "Management", document.getElementById('management').value],
    ["Expenses", "Supplies", document.getElementById('supplies').value],
    ["Expenses", "Staff", document.getElementById('staff').value],
    ["Expenses", "Misc & Reserves", document.getElementById('misc').value],
    spacer[0],
    ["Financing", "Purchase Price", document.getElementById('purchasePrice').value],
    ["Financing", "Loan Amount", document.getElementById('loanAmount').value],
    ["Financing", "Interest Rate (%)", document.getElementById('interestRate').value],
    ["Financing", "Loan Term (Years)", document.getElementById('loanTerm').value],
    
  ];

  const inputSheet = XLSX.utils.aoa_to_sheet([...title, [], ...inputData]);
  inputSheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
  inputSheet["A1"].s = { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } };
  inputSheet["A3"] = { t: "s", v: "Category", s: { font: { bold: true } } };
  inputSheet["B3"] = { t: "s", v: "Field", s: { font: { bold: true } } };
  inputSheet["C3"] = { t: "s", v: "Value", s: { font: { bold: true } } };

  XLSX.utils.book_append_sheet(wb, inputSheet, "Inputs");

  // Export Results
  const resultsTable = document.querySelector('#results table');
  if (resultsTable) {
    const summarySheet = XLSX.utils.table_to_sheet(resultsTable);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Results");
  }

  // Export 5-Year Projection
  const fiveYearTable = document.querySelector('#fiveYearTable table');
  if (fiveYearTable) {
    const projSheet = XLSX.utils.table_to_sheet(fiveYearTable);
    XLSX.utils.book_append_sheet(wb, projSheet, "5-Year Projection");
  }

  XLSX.writeFile(wb, "Multifamily_Proforma_Export.xlsx");
}

// Reset
function resetInputs() {
  document.querySelectorAll('input').forEach(input => input.value = '');
}

// Autofill Demo

function autofillDemo() {
  const tenants = [
    ["Starbucks", 2000, 45],
    ["Verizon", 3500, 42],
    ["Chase Bank", 4200, 50]
  ];
  const tenantRows = document.getElementById('tenantRows');
  tenantRows.innerHTML = ""; // Clear any existing

  tenants.forEach(([name, sf, rent]) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input class="input" value="${name}" /></td>
      <td><input class="input" type="number" value="${sf}" /></td>
      <td><input class="input" type="number" value="${rent}" /></td>
      <td><input class="input" type="date" /></td>
      <td><input class="input" type="date" /></td>
      <td><input class="input" type="number" value="2" /></td>
      <td><button class="btn text-sm bg-red-500 hover:bg-red-600" onclick="this.closest('tr').remove()">🗑</button></td>
    `;
    tenantRows.appendChild(row);
  });

  document.getElementById('otherIncome').value = 206500;
  document.getElementById('vacancyRate').value = 5;
  document.getElementById('propertyTaxes').value = 288486;
  document.getElementById('insurance').value = 66851;
  document.getElementById('utilities').value = 160900;
  document.getElementById('maintenance').value = 150000;
  document.getElementById('management').value = 70517;
  document.getElementById('supplies').value = 30160;
  document.getElementById('staff').value = 41390; // HVAC + Sewer + Elevator
  document.getElementById('misc').value = 0;
  document.getElementById('purchasePrice').value = 22000000;
  document.getElementById('loanAmount').value = 15400000;
  document.getElementById('interestRate').value = 6;
  document.getElementById('loanTerm').value = 25;
}


});


function getTenantBaseRent() {
  const rows = document.querySelectorAll("#tenantRows tr");
  let totalRent = 0;

  rows.forEach(row => {
    const cells = row.querySelectorAll("input");
    const sf = parseFloat(cells[1].value) || 0;
    const rentPerSF = parseFloat(cells[2].value) || 0;
    totalRent += sf * rentPerSF;
  });

  return totalRent;
}

function addTenantRow() {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input class="input" placeholder="Tenant" /></td>
    <td><input class="input" type="number" /></td>
    <td><input class="input" type="number" /></td>
    <td><input class="input" type="date" /></td>
    <td><input class="input" type="date" /></td>
    <td><input class="input" type="number" value="2" /></td>
    <td><button class="btn text-sm bg-red-500 hover:bg-red-600" onclick="this.closest('tr').remove()">🗑</button></td>
  `;
  document.getElementById("tenantRows").appendChild(row);
}


function exportToExcel() {
  const wb = XLSX.utils.book_new();

  // Export Results Summary
  const summaryEl = document.getElementById('results');
  if (summaryEl) {
    const summaryTable = XLSX.utils.table_to_sheet(summaryEl);
    summaryTable['!merges'] = [{s: {r: 11, c: 0}, e: {r: 11, c: 1}}];  // merge decision row
XLSX.utils.book_append_sheet(wb, summaryTable, 'Summary');
  }

  // Export 5-Year Proforma
  const proformaEl = document.getElementById('fiveYearTable');
  if (proformaEl) {
    const proformaTable = XLSX.utils.table_to_sheet(proformaEl);
    XLSX.utils.book_append_sheet(wb, proformaTable, '5-Year Proforma');
  }

  // Export Tenant Roster
  const tenantTable = document.getElementById('tenantTable');
  if (tenantTable) {
    const tenantSheet = XLSX.utils.table_to_sheet(tenantTable);
    XLSX.utils.book_append_sheet(wb, tenantSheet, 'Tenant Roster');
  }

  XLSX.writeFile(wb, 'Commercial_Proforma.xlsx');
}



function exportToExcel() {
  const wb = XLSX.utils.book_new();

  // Export Results Summary if present
  const resultsTable = document.querySelector("#results table");
  if (resultsTable) {
    const summarySheet = XLSX.utils.table_to_sheet(resultsTable);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  }

  // Export 5-Year Proforma if present
  const proformaTable = document.getElementById("fiveYearTable");
  if (proformaTable) {
    const proformaSheet = XLSX.utils.table_to_sheet(proformaTable);
    XLSX.utils.book_append_sheet(wb, proformaSheet, "5-Year Proforma");
  }

  // Export Tenant Roster
  const tenantTable = document.getElementById("tenantTable");
  if (tenantTable) {
    const tenantSheet = XLSX.utils.table_to_sheet(tenantTable);
    XLSX.utils.book_append_sheet(wb, tenantSheet, "Tenant Roster");
  }

  
  const customInputs = [
    ["Inputs", "Total Potential Rent", grossPotentialRent.toLocaleString()]
  ];
  const customSheet = XLSX.utils.aoa_to_sheet(customInputs);
  XLSX.utils.book_append_sheet(wb, customSheet, "Inputs");

  XLSX.writeFile(wb, "Commercial_Proforma.xlsx");
}
