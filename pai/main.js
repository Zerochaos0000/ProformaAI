document.addEventListener('DOMContentLoaded', function () {

  // ─── Tab Switching ──────────────────────────────────────────────
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.getElementById(target).classList.add('active');
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('border-[#0056b3]', 'text-[#0056b3]');
        btn.classList.add('border-transparent', 'text-gray-500');
      });
      button.classList.remove('border-transparent', 'text-gray-500');
      button.classList.add('border-[#0056b3]', 'text-[#0056b3]');

      if (target === 'charts-tab') {
        renderCharts(_lastEgi, _lastNoi, _lastExpenses);
      }
    });
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // ─── State for chart re-render ──────────────────────────────────
  let _lastEgi = 0, _lastNoi = 0, _lastExpenses = 0;
  let _incomeChart = null, _expenseChart = null;

  // ─── Helpers ────────────────────────────────────────────────────
  function parseCurrency(val) {
    return Number(String(val).replace(/[^0-9.-]+/g, '')) || 0;
  }

  function getVal(id) {
    return parseCurrency(document.getElementById(id).value);
  }

  // ─── Main Calculation ───────────────────────────────────────────
  document.getElementById('calculate').addEventListener('click', calculateProforma);

  function calculateProforma() {
    const units = [
      { count: getVal('oneBedUnits'),   rent: getVal('rent1Bed') },
      { count: getVal('twoBedUnits'),   rent: getVal('rent2Bed') },
      { count: getVal('threeBedUnits'), rent: getVal('rent3Bed') }
    ];

    const otherIncome  = getVal('otherIncome');
    const vacancyRate  = parseFloat(document.getElementById('vacancyRate').value) / 100 || 0;

    const grossPotentialRent = units.reduce((sum, u) => sum + u.count * u.rent * 12, 0);
    const vacancyLoss        = grossPotentialRent * vacancyRate;
    const effectiveGrossIncome = grossPotentialRent + otherIncome - vacancyLoss;

    const expenseIds = ['propertyTaxes','insurance','utilities','maintenance','management','supplies','staff','misc'];
    const totalExpenses = expenseIds.reduce((sum, id) => sum + getVal(id), 0);
    const NOI = effectiveGrossIncome - totalExpenses;

    const loanAmount    = getVal('loanAmount');
    const interestRate  = parseFloat(document.getElementById('interestRate').value) / 100 || 0;
    const loanTerm      = parseInt(document.getElementById('loanTerm').value) || 0;
    const monthlyRate   = interestRate / 12;
    const monthlyPayment = loanAmount && monthlyRate
      ? loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -loanTerm * 12))
      : 0;
    const annualDebtService = monthlyPayment * 12;

    const purchasePrice    = getVal('purchasePrice');
    const initialEquity    = purchasePrice - loanAmount;
    const cashFlowBeforeTax = NOI - annualDebtService;
    const cashOnCash       = initialEquity ? (cashFlowBeforeTax / initialEquity) * 100 : 0;
    const capRate          = purchasePrice ? (NOI / purchasePrice) * 100 : 0;

    // IRR (5-year hold, 6% exit cap)
    const exitCapRate    = 0.06;
    const salePrice      = NOI * (1 / exitCapRate);
    const totalPayments  = loanTerm * 12;
    const paymentsMade   = 5 * 12;
    const remainingBalance = loanAmount && monthlyRate
      ? loanAmount * (Math.pow(1+monthlyRate, totalPayments) - Math.pow(1+monthlyRate, paymentsMade)) / (Math.pow(1+monthlyRate, totalPayments) - 1)
      : 0;
    const netSaleProceeds = salePrice - remainingBalance;
    const yearlyCashFlows = Array(4).fill(cashFlowBeforeTax);
    yearlyCashFlows.push(cashFlowBeforeTax + netSaleProceeds);
    const irrCashFlows = [-initialEquity, ...yearlyCashFlows];
    const irr = calculateIRR(irrCashFlows);

    // Decision text
    let decisionText = '';
    if (cashOnCash >= 12) {
      decisionText = `✅ This appears to be a strong investment opportunity (CoC: ${Math.round(cashOnCash)}%)`;
    } else if (cashOnCash >= 8) {
      decisionText = `⚠️ Moderate returns. Consider refining assumptions (CoC: ${Math.round(cashOnCash)}%)`;
    } else {
      decisionText = `❌ Low investment return. Proceed with caution (CoC: ${Math.round(cashOnCash)}%)`;
    }

    // Store for chart re-render
    _lastEgi = effectiveGrossIncome;
    _lastNoi = NOI;
    _lastExpenses = totalExpenses;

    // Render all sections
    renderSummaryCards({ effectiveGrossIncome, NOI, cashFlowBeforeTax, cashOnCash, capRate, irr });
    renderResultsTable({ grossPotentialRent, vacancyLoss, effectiveGrossIncome, totalExpenses, NOI, annualDebtService, cashFlowBeforeTax, cashOnCash, capRate, irr, decisionText });
    render5YearProforma(effectiveGrossIncome, totalExpenses, annualDebtService);
    renderCharts(effectiveGrossIncome, NOI, totalExpenses);

    // Switch to Results tab
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('results-tab').classList.add('active');
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('border-[#0056b3]', 'text-[#0056b3]');
      btn.classList.add('border-transparent', 'text-gray-500');
    });
    const resultsBtn = document.querySelector('[data-tab="results-tab"]');
    if (resultsBtn) {
      resultsBtn.classList.remove('border-transparent', 'text-gray-500');
      resultsBtn.classList.add('border-[#0056b3]', 'text-[#0056b3]');
    }
  }

  // ─── IRR Calculator ─────────────────────────────────────────────
  function calculateIRR(cashFlows) {
    let rate = 0.12;
    const maxIter = 100;
    const eps = 1e-6;
    for (let i = 0; i < maxIter; i++) {
      let npv = 0, derivative = 0;
      for (let t = 0; t < cashFlows.length; t++) {
        const denom = Math.pow(1 + rate, t);
        npv += cashFlows[t] / denom;
        if (t > 0) derivative -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
      }
      const newRate = rate - npv / derivative;
      if (Math.abs(newRate - rate) < eps) break;
      rate = newRate;
    }
    return rate * 100;
  }

  // ─── Summary Cards (like mixeduse) ──────────────────────────────
  function renderSummaryCards({ effectiveGrossIncome, NOI, cashFlowBeforeTax, cashOnCash, capRate, irr }) {
    const container = document.getElementById('summary-cards');
    if (!container) return;
    container.innerHTML = `
      <div class="bg-green-50 p-4 rounded shadow border border-green-200">
        <h4 class="font-semibold text-green-800 text-sm">Effective Gross Income</h4>
        <p class="text-green-900 text-xl font-bold mt-1">$${Math.round(effectiveGrossIncome).toLocaleString()}</p>
      </div>
      <div class="bg-blue-50 p-4 rounded shadow border border-blue-200">
        <h4 class="font-semibold text-blue-800 text-sm">Net Operating Income (NOI)</h4>
        <p class="text-blue-900 text-xl font-bold mt-1">$${Math.round(NOI).toLocaleString()}</p>
      </div>
      <div class="bg-yellow-50 p-4 rounded shadow border border-yellow-200">
        <h4 class="font-semibold text-yellow-800 text-sm">Cash Flow Before Tax</h4>
        <p class="text-yellow-900 text-xl font-bold mt-1">$${Math.round(cashFlowBeforeTax).toLocaleString()}</p>
      </div>
      <div class="bg-purple-50 p-4 rounded shadow border border-purple-200">
        <h4 class="font-semibold text-purple-800 text-sm">Cash-on-Cash Return</h4>
        <p class="text-purple-900 text-xl font-bold mt-1">${Math.round(cashOnCash)}%</p>
      </div>
      <div class="bg-pink-50 p-4 rounded shadow border border-pink-200">
        <h4 class="font-semibold text-pink-800 text-sm">Cap Rate</h4>
        <p class="text-pink-900 text-xl font-bold mt-1">${capRate.toFixed(2)}%</p>
      </div>
      <div class="bg-gray-100 p-4 rounded shadow border border-gray-300">
        <h4 class="font-semibold text-gray-800 text-sm">Estimated IRR</h4>
        <p class="text-gray-900 text-xl font-bold mt-1">${Math.round(irr)}%</p>
      </div>
    `;
  }

  // ─── Detailed Results Table ──────────────────────────────────────
  function renderResultsTable({ grossPotentialRent, vacancyLoss, effectiveGrossIncome, totalExpenses, NOI, annualDebtService, cashFlowBeforeTax, cashOnCash, capRate, irr, decisionText }) {
    const container = document.getElementById('results');
    if (!container) return;
    container.innerHTML = `
      <div class="bg-[#f9fafb] rounded p-4">
        <table class="w-full text-left" style="border-collapse:collapse;">
          <tr><td class="py-2 px-3 text-[#374151] font-medium border-b border-gray-100">Total Potential Rent</td><td class="py-2 px-3 text-[#111827] font-semibold border-b border-gray-100 text-right">$${Math.round(grossPotentialRent).toLocaleString()}</td></tr>
          <tr><td class="py-2 px-3 text-[#374151] font-medium border-b border-gray-100">Vacancy Loss</td><td class="py-2 px-3 text-red-600 font-semibold border-b border-gray-100 text-right">-$${Math.round(vacancyLoss).toLocaleString()}</td></tr>
          <tr><td class="py-2 px-3 text-[#374151] font-medium border-b border-gray-100">Effective Gross Income</td><td class="py-2 px-3 text-[#111827] font-semibold border-b border-gray-100 text-right">$${Math.round(effectiveGrossIncome).toLocaleString()}</td></tr>
          <tr><td class="py-2 px-3 text-[#374151] font-medium border-b border-gray-100">Operating Expenses</td><td class="py-2 px-3 text-red-600 font-semibold border-b border-gray-100 text-right">-$${Math.round(totalExpenses).toLocaleString()}</td></tr>
          <tr><td class="py-2 px-3 text-[#0056b3] font-bold border-b border-blue-100 bg-blue-50">Net Operating Income (NOI)</td><td class="py-2 px-3 text-[#0056b3] font-bold border-b border-blue-100 bg-blue-50 text-right">$${Math.round(NOI).toLocaleString()}</td></tr>
          <tr><td class="py-2 px-3 text-[#374151] font-medium border-b border-gray-100">Annual Debt Service</td><td class="py-2 px-3 text-red-600 font-semibold border-b border-gray-100 text-right">-$${Math.round(annualDebtService).toLocaleString()}</td></tr>
          <tr><td class="py-2 px-3 text-[#0056b3] font-bold border-b border-blue-100 bg-blue-50">Cash Flow Before Tax</td><td class="py-2 px-3 text-[#0056b3] font-bold border-b border-blue-100 bg-blue-50 text-right">$${Math.round(cashFlowBeforeTax).toLocaleString()}</td></tr>
          <tr><td class="py-2 px-3 text-[#374151] font-medium border-b border-gray-100">Cash-on-Cash Return</td><td class="py-2 px-3 text-[#111827] font-semibold border-b border-gray-100 text-right">${Math.round(cashOnCash)}%</td></tr>
          <tr><td class="py-2 px-3 text-[#374151] font-medium border-b border-gray-100">Cap Rate</td><td class="py-2 px-3 text-[#111827] font-semibold border-b border-gray-100 text-right">${capRate.toFixed(2)}%</td></tr>
          <tr><td class="py-2 px-3 text-[#374151] font-medium">Estimated IRR</td><td class="py-2 px-3 text-[#111827] font-semibold text-right">${Math.round(irr)}%</td></tr>
        </table>
      </div>
      <div class="mt-4 p-4 rounded-md ${cashOnCash >= 12 ? 'bg-green-50 border border-green-200 text-green-800' : cashOnCash >= 8 ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' : 'bg-red-50 border border-red-200 text-red-800'} font-semibold">
        ${decisionText}
      </div>
    `;
  }

  // ─── 5-Year Proforma ────────────────────────────────────────────
  function render5YearProforma(income, expenses, debtService) {
    const container = document.getElementById('fiveYearTable');
    if (!container) return;
    let table = `
      <table class="w-full text-left text-sm text-[#4B5563]" style="border-collapse:collapse;">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2 border-b-2 border-gray-200 font-semibold text-[#374151]">Year</th>
            <th class="p-2 border-b-2 border-gray-200 font-semibold text-[#374151]">Income</th>
            <th class="p-2 border-b-2 border-gray-200 font-semibold text-[#374151]">Expenses</th>
            <th class="p-2 border-b-2 border-gray-200 font-semibold text-[#374151]">NOI</th>
            <th class="p-2 border-b-2 border-gray-200 font-semibold text-[#374151]">Debt Service</th>
            <th class="p-2 border-b-2 border-gray-200 font-semibold text-[#374151]">Cash Flow</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (let y = 1; y <= 5; y++) {
      const growth       = Math.pow(1.02, y - 1);
      const yearIncome   = income * growth;
      const yearExpenses = expenses * growth;
      const yearNOI      = yearIncome - yearExpenses;
      const cashFlow     = yearNOI - debtService;
      const cfColor      = cashFlow >= 0 ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold';
      table += `
        <tr class="border-b border-gray-100 hover:bg-blue-50 transition-colors">
          <td class="p-2 font-medium text-[#374151]">${y}</td>
          <td class="p-2">$${Math.round(yearIncome).toLocaleString()}</td>
          <td class="p-2">$${Math.round(yearExpenses).toLocaleString()}</td>
          <td class="p-2 font-medium text-[#0056b3]">$${Math.round(yearNOI).toLocaleString()}</td>
          <td class="p-2">$${Math.round(debtService).toLocaleString()}</td>
          <td class="p-2 ${cfColor}">$${Math.round(cashFlow).toLocaleString()}</td>
        </tr>
      `;
    }
    table += '</tbody></table>';
    container.innerHTML = table;
  }

  // ─── Charts ─────────────────────────────────────────────────────
  function renderCharts(egi, noi, expenses) {
    const incomeCtx  = document.getElementById('incomeChart');
    const expenseCtx = document.getElementById('expenseChart');
    if (!incomeCtx || !expenseCtx) return;

    // Destroy old charts if they exist
    if (_incomeChart)  { _incomeChart.destroy();  _incomeChart  = null; }
    if (_expenseChart) { _expenseChart.destroy(); _expenseChart = null; }

    _incomeChart = new Chart(incomeCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Effective Gross Income', 'NOI'],
        datasets: [{
          data: [egi, noi],
          backgroundColor: ['#3b82f6', '#22c55e'],
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => '$' + Math.round(ctx.parsed.y).toLocaleString()
            }
          }
        },
        scales: {
          y: {
            ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'k' },
            grid: { color: '#f3f4f6' }
          }
        }
      }
    });

    _expenseChart = new Chart(expenseCtx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Expenses', 'NOI'],
        datasets: [{
          data: [expenses, noi],
          backgroundColor: ['#ef4444', '#22c55e'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: ctx => ctx.label + ': $' + Math.round(ctx.parsed).toLocaleString()
            }
          }
        }
      }
    });
  }

  // ─── Export Excel ───────────────────────────────────────────────
  document.getElementById('exportXls').addEventListener('click', exportToExcel);

  function exportToExcel() {
    const wb = XLSX.utils.book_new();

    const title  = [['REProforma - Multifamily Acquisition Proforma']];
    const spacer = [['']];

    const inputData = [
      ['Category', 'Field', 'Value'],
      ['Rental Mix', '1-Bed Units',     document.getElementById('oneBedUnits').value],
      ['Rental Mix', 'Rent per 1-Bed',  document.getElementById('rent1Bed').value],
      ['Rental Mix', '2-Bed Units',     document.getElementById('twoBedUnits').value],
      ['Rental Mix', 'Rent per 2-Bed',  document.getElementById('rent2Bed').value],
      ['Rental Mix', '3-Bed Units',     document.getElementById('threeBedUnits').value],
      ['Rental Mix', 'Rent per 3-Bed',  document.getElementById('rent3Bed').value],
      spacer[0],
      ['Income', 'Other Income',   document.getElementById('otherIncome').value],
      ['Income', 'Vacancy Rate (%)', document.getElementById('vacancyRate').value],
      spacer[0],
      ['Expenses', 'Property Taxes', document.getElementById('propertyTaxes').value],
      ['Expenses', 'Insurance',      document.getElementById('insurance').value],
      ['Expenses', 'Utilities',      document.getElementById('utilities').value],
      ['Expenses', 'Maintenance',    document.getElementById('maintenance').value],
      ['Expenses', 'Management',     document.getElementById('management').value],
      ['Expenses', 'Supplies',       document.getElementById('supplies').value],
      ['Expenses', 'Staff',          document.getElementById('staff').value],
      ['Expenses', 'Misc & Reserves',document.getElementById('misc').value],
      spacer[0],
      ['Financing', 'Purchase Price',     document.getElementById('purchasePrice').value],
      ['Financing', 'Loan Amount',        document.getElementById('loanAmount').value],
      ['Financing', 'Interest Rate (%)',  document.getElementById('interestRate').value],
      ['Financing', 'Loan Term (Years)',  document.getElementById('loanTerm').value],
    ];

    const inputSheet = XLSX.utils.aoa_to_sheet([...title, [], ...inputData]);
    XLSX.utils.book_append_sheet(wb, inputSheet, 'Inputs');

    const resultsTable = document.querySelector('#results table');
    if (resultsTable) {
      const summarySheet = XLSX.utils.table_to_sheet(resultsTable);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Results');
    }

    const fiveYearTable = document.querySelector('#fiveYearTable table');
    if (fiveYearTable) {
      const projSheet = XLSX.utils.table_to_sheet(fiveYearTable);
      XLSX.utils.book_append_sheet(wb, projSheet, '5-Year Projection');
    }

    XLSX.writeFile(wb, 'Multifamily_Proforma_Export.xlsx');
  }

  // ─── Export PDF ─────────────────────────────────────────────────
  document.getElementById('exportPdf').addEventListener('click', () => window.print());

  // ─── Reset ──────────────────────────────────────────────────────
  document.getElementById('resetInputs').addEventListener('click', () => {
    document.querySelectorAll('input').forEach(input => input.value = '');
    const sc = document.getElementById('summary-cards');
    if (sc) sc.innerHTML = '';
    const res = document.getElementById('results');
    if (res) res.innerHTML = '';
    const fy = document.getElementById('fiveYearTable');
    if (fy) fy.innerHTML = '';
    if (_incomeChart)  { _incomeChart.destroy();  _incomeChart  = null; }
    if (_expenseChart) { _expenseChart.destroy(); _expenseChart = null; }
  });

  // ─── Autofill Demo ───────────────────────────────────────────────
  document.getElementById('autofillDemo').addEventListener('click', () => {
    document.getElementById('oneBedUnits').value  = 20;
    document.getElementById('rent1Bed').value      = 1200;
    document.getElementById('twoBedUnits').value  = 35;
    document.getElementById('rent2Bed').value      = 1500;
    document.getElementById('threeBedUnits').value = 15;
    document.getElementById('rent3Bed').value      = 1800;
    document.getElementById('otherIncome').value   = 25000;
    document.getElementById('vacancyRate').value   = 5;
    document.getElementById('propertyTaxes').value = 40000;
    document.getElementById('insurance').value     = 12000;
    document.getElementById('utilities').value     = 25000;
    document.getElementById('maintenance').value   = 15000;
    document.getElementById('management').value    = 20000;
    document.getElementById('supplies').value      = 5000;
    document.getElementById('staff').value         = 30000;
    document.getElementById('misc').value          = 8000;
    document.getElementById('purchasePrice').value = 5000000;
    document.getElementById('loanAmount').value    = 3500000;
    document.getElementById('interestRate').value  = 5;
    document.getElementById('loanTerm').value      = 25;
  });

});
