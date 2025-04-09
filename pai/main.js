
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed top-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow z-50';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', function () {
  const calculateBtn = document.getElementById('calculate');
  const exportPdfBtn = document.getElementById('exportPdf');
  const exportCsvBtn = document.getElementById('exportCsv');

  let latestMetrics = {};
  let proformaRows = [];

  calculateBtn.addEventListener('click', function () {
    const getVal = id => parseFloat(document.getElementById(id).value) || 0;

    const annualRent = getVal('oneBedUnits') * getVal('rent1Bed') * 12 +
                       getVal('twoBedUnits') * getVal('rent2Bed') * 12 +
                       getVal('threeBedUnits') * getVal('rent3Bed') * 12;

    const totalExpenses = getVal('taxes') + getVal('insurance') + getVal('utilities') + getVal('elevator') +
                          getVal('management') + getVal('supplies') + getVal('misc') +
                          getVal('staff') + getVal('repairs');

    const noi = annualRent - totalExpenses;
    const purchasePrice = getVal('purchasePrice');
    const terminalCapRate = getVal('terminalCapRate') / 100;
    const costOfSale = getVal('costOfSale') / 100;
    const loanAmount = getVal('loanAmount');
    const rate = getVal('loanRate') / 100;
    const amort = getVal('loanAmort');

    const r = rate / 12, n = amort * 12;
    const monthlyDebt = loanAmount * r / (1 - Math.pow(1 + r, -n));
    const annualDebtService = monthlyDebt * 12;
    const annualCashFlow = noi - annualDebtService;

    const noiYr5 = noi * Math.pow(1.02, 4);
    const salePrice = noiYr5 / terminalCapRate;
    const netSale = salePrice * (1 - costOfSale);
    const equity = purchasePrice - loanAmount;

    const cashFlows = [
      annualCashFlow,
      annualCashFlow * 1.02,
      annualCashFlow * 1.04,
      annualCashFlow * 1.06,
      annualCashFlow * 1.08 + netSale
    ];
    const irr = calcIRR([-equity, ...cashFlows]);
    const equityMult = cashFlows.reduce((a, b) => a + b, 0) / equity;

    latestMetrics = {
      noi,
      totalExpenses,
      annualDebtService,
      cashFlowBeforeTax: annualCashFlow,
      irr: irr.toFixed(2),
      equityMultiple: equityMult.toFixed(2)
    };

    proformaRows = generateProformaTable(
      annualRent, totalExpenses, 0.05, annualDebtService, terminalCapRate, costOfSale, loanAmount, amort, rate
    );

    document.getElementById('results').innerHTML = `
      <div class="mt-6 bg-white p-4 rounded shadow">
        <h2 class="text-xl font-semibold mb-2">📊 Investment Results</h2>
        <p><strong>NOI (Year 1):</strong> $${noi.toLocaleString()}</p>
        <p><strong>Total Expenses:</strong> $${totalExpenses.toLocaleString()}</p>
        <p><strong>Annual Debt Service:</strong> $${annualDebtService.toLocaleString()}</p>
        <p><strong>Cash Flow Before Tax:</strong> $${annualCashFlow.toLocaleString()}</p>
        <p><strong>IRR:</strong> ${irr.toFixed(2)}%</p>
        <p><strong>Equity Multiple:</strong> ${equityMult.toFixed(2)}x</p>
        <p class="mt-2 text-${irr >= 14 ? 'green' : 'red'}-600 font-semibold">
          ${irr >= 14 ? '✅ Good Investment' : '⚠️ Risky Investment'}
        </p>
      </div>`;

    displayProformaTable(proformaRows);
  });

  exportPdfBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Multifamily Proforma Report', 20, 20);
    doc.setFontSize(12);
    let y = 30;
    Object.entries(latestMetrics).forEach(([k, v]) => {
      doc.text(`${k.replace(/([A-Z])/g, ' $1')}: ${v}`, 20, y);
      y += 10;
    });
    doc.autoTable({
      head: [['Year', 'Potential Rent', 'Other Income', 'Gross Income', 'Vacancy', 'EGI', 'Expenses', 'NOI', 'Op Margin', 'Debt Svc', 'CFBT']],
      body: proformaRows.map(row => row.map(val => (typeof val === 'number' ? val.toFixed(0) : val))),
      startY: y + 10,
      theme: 'striped'
    });
    doc.save('Proforma_Report.pdf');
    showToast('PDF exported successfully!');
  });

  exportCsvBtn.addEventListener('click', () => {
    let csv = 'Metric,Value\n';
    Object.entries(latestMetrics).forEach(([k, v]) => {
      csv += `${k},${v}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Proforma_Report.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully!');
  });

  exportCsvBtn.insertAdjacentHTML("afterend", '<button id="exportExcel" class="ml-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">📥 Export to Excel</button>');

  document.getElementById('exportExcel').addEventListener('click', () => {
    const wb = XLSX.utils.book_new();
    const rows = [['Year', 'Potential Rent', 'Other Income', 'Gross Income', 'Vacancy', 'EGI', 'Expenses', 'NOI', 'Op Margin', 'Debt Svc', 'CFBT']];
    proformaRows.forEach(r => rows.push(r));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Multifamily Proforma');
    XLSX.writeFile(wb, 'Proforma_Export.xlsx');
    showToast('Excel exported successfully!');
  });

  function calcIRR(cashFlows, guess = 0.10) {
    let rate = guess;
    const maxIter = 1000, precision = 1e-6;
    for (let i = 0; i < maxIter; i++) {
      let npv = 0, deriv = 0;
      for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + rate, t);
        deriv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
      }
      const newRate = rate - npv / deriv;
      if (Math.abs(newRate - rate) < precision) return newRate * 100;
      rate = newRate;
    }
    return rate * 100;
  }
});


function generateProformaTable(baseRent, baseExpenses, vacancyRate, debtService, terminalCapRate, costOfSaleRate, loanAmount, amortYears, rate) {
  const growthRent = 0.05;
  const growthExpense = 0.02;
  const rows = [];

  const monthlyRate = rate / 12;
  const n = amortYears * 12;
  const monthlyDebt = loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n));

  for (let year = 1; year <= 5; year++) {
    const rent = baseRent * Math.pow(1 + growthRent, year - 1);
    const otherIncome = 0;
    const grossIncome = rent + otherIncome;
    const vacancy = -vacancyRate * grossIncome;
    const effectiveIncome = grossIncome + vacancy;
    const expenses = baseExpenses * Math.pow(1 + growthExpense, year - 1);
    const noi = effectiveIncome - expenses;
    const margin = ((noi / effectiveIncome) * 100).toFixed(1) + "%";
    const cfbt = noi - debtService;

    rows.push([
      `Year ${year}`, rent, otherIncome, grossIncome, vacancy, effectiveIncome,
      expenses, noi, margin, debtService, cfbt
    ]);
  }

  const noiYr5 = rows[4][7];
  const saleValue = noiYr5 / terminalCapRate;
  const costOfSale = saleValue * costOfSaleRate;

  let balance = loanAmount;
  for (let i = 0; i < 60; i++) {
    const interest = balance * monthlyRate;
    const principal = monthlyDebt - interest;
    balance -= principal;
  }

  const netProceeds = saleValue - costOfSale - balance;

  rows.push(["Future Sale Value", "", "", "", "", "", "", "", "", "", saleValue]);
  rows.push(["Cost of Sale", "", "", "", "", "", "", "", "", "", -costOfSale]);
  rows.push(["Loan Balance", "", "", "", "", "", "", "", "", "", -balance]);
  rows.push(["Net Sale Proceeds", "", "", "", "", "", "", "", "", "", netProceeds]);

  return rows;
}

function displayProformaTable(data) {
  const headers = ["Year", "Potential Rent", "Other Income", "Gross Income", "Vacancy", "EGI", "Expenses", "NOI", "Op Margin", "Debt Svc", "CFBT"];
  const table = document.createElement("table");
  table.className = "w-full table-auto border border-gray-300 mt-4";
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.className = "border px-2 py-1 bg-gray-100";
    th.textContent = h;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  data.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.className = "border px-2 py-1 text-right";
      td.textContent = typeof cell === "number" ? "$" + cell.toLocaleString(undefined, { maximumFractionDigits: 0 }) : cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  const container = document.getElementById("proformaTable");
  container.innerHTML = "<h3 class='text-lg font-semibold mb-2'>📈 5-Year Proforma</h3>";
  container.appendChild(table);
}
