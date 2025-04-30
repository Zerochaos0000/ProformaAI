// commercial-retail.js

// Utility functions
const parse = id => parseFloat(document.getElementById(id).value) || 0;
const setText = (id, val) => document.getElementById(id).innerText = val.toLocaleString(undefined, { minimumFractionDigits: 2 });

// Handle tab switching
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    const target = button.getAttribute('data-tab');
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[id="${target}"]`).classList.add('active');
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('border-[#0056b3]', 'text-[#0056b3]'));
    button.classList.add('border-[#0056b3]', 'text-[#0056b3]');

    // If charts tab, trigger chart rendering
    if (target === 'charts-tab') {
      renderCharts();
    }
  });
});

// Main calculation trigger
document.getElementById('calculate').addEventListener('click', () => {
  const buildingSize = parse('buildingSize');
  const avgRent = parse('avgRentPerSf');
  const occupancy = parse('occupancyRate') / 100;
  const camReim = parse('camReimbursements');
  const otherIncome = parse('otherIncome');
  const realEstateTaxes = parse('realEstateTaxes');
  const insurance = parse('insurance');
  const camExpense = parse('camExpense');
  const mgmtFeePct = parse('managementFee') / 100;
  const repairs = parse('repairsMaint');
  const utilities = parse('utilities');
  const otherOpex = parse('otherOpex');
  const reserves = parse('capitalReserves');
  const price = parse('purchasePrice');
  const closingPct = parse('closingCosts') / 100;
  const tiAllowance = parse('tiAllowance');
  const leasingCommissions = parse('leasingCommissions') / 100;
  const capex = parse('capitalImprovements');
  const year1Budget = parse('year1Budget');

  const ltv = parse('loanToValue') / 100;
  const rate = parse('interestRate') / 100;
  const amort = parse('amortization');
  const term = parse('loanTerm');
  const hold = parse('holdPeriod');
  const capRate = parse('terminalCapRate') / 100;
  const salesCosts = parse('salesCosts') / 100;
  const rentGrowth = parse('rentGrowth') / 100;

  const egi = buildingSize * avgRent * occupancy + buildingSize * camReim + otherIncome;
  const mgmtFee = egi * mgmtFeePct;
  const opex = buildingSize * (realEstateTaxes + insurance + camExpense + repairs + utilities + otherOpex + reserves) + mgmtFee;
  const noi = egi - opex;

  const debt = price * ltv;
  const equity = price * (1 + closingPct) + tiAllowance * buildingSize + leasingCommissions * price + capex + year1Budget - debt;
  const annualDebtService = (debt * rate) / (1 - Math.pow(1 + rate, -amort));
  const cfbTax = noi - annualDebtService;
  const noiAtExit = noi * Math.pow(1 + rentGrowth, hold);
  const saleValue = noiAtExit / capRate;
  const netSales = saleValue * (1 - salesCosts);
  const loanBalance = debt * ((Math.pow(1 + rate, term) - Math.pow(1 + rate, term - hold)) / (Math.pow(1 + rate, term) - 1));
  const netProceeds = netSales - loanBalance;
  const totalProfit = cfbTax * hold + netProceeds - equity;
  const irr = ((cfbTax * hold + netProceeds) / equity) ** (1 / hold) - 1;
  const multiple = (cfbTax * hold + netProceeds) / equity;

  renderSummary({ noi, egi, opex, cfbTax, saleValue, netProceeds, irr, multiple });

  // Show Results tab by default
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById('results-tab').classList.add('active');
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('border-[#0056b3]', 'text-[#0056b3]'));
  document.querySelector('[data-tab="results-tab"]').classList.add('border-[#0056b3]', 'text-[#0056b3]');
});

// commercial-retail.js

function renderSummary({ noi, egi, opex, cfbTax, saleValue, netProceeds, irr, multiple }) {
  const container = document.getElementById('summary-cards');
  if (!container) return;
  container.innerHTML = `
    <div class="bg-green-50 p-4 rounded shadow border border-green-200">
      <h4 class="font-semibold text-green-800">Effective Gross Income</h4>
      <p class="text-green-900 text-lg font-bold">$${egi.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    </div>
    <div class="bg-blue-50 p-4 rounded shadow border border-blue-200">
      <h4 class="font-semibold text-blue-800">NOI</h4>
      <p class="text-blue-900 text-lg font-bold">$${noi.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    </div>
    <div class="bg-yellow-50 p-4 rounded shadow border border-yellow-200">
      <h4 class="font-semibold text-yellow-800">Cash Flow Before Tax</h4>
      <p class="text-yellow-900 text-lg font-bold">$${cfbTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    </div>
    <div class="bg-purple-50 p-4 rounded shadow border border-purple-200">
      <h4 class="font-semibold text-purple-800">Net Sale Proceeds</h4>
      <p class="text-purple-900 text-lg font-bold">$${netProceeds.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    </div>
    <div class="bg-pink-50 p-4 rounded shadow border border-pink-200">
      <h4 class="font-semibold text-pink-800">IRR</h4>
      <p class="text-pink-900 text-lg font-bold">${(irr * 100).toFixed(2)}%</p>
    </div>
    <div class="bg-gray-100 p-4 rounded shadow border border-gray-300">
      <h4 class="font-semibold text-gray-800">Equity Multiple</h4>
      <p class="text-gray-900 text-lg font-bold">${multiple.toFixed(2)}x</p>
    </div>
  `;
}

function renderCharts() {
  const projectionCtx = document.getElementById('projectionGraph');
  const noiCtx = document.getElementById('noiDebtService');
  const occCtx = document.getElementById('occupancyRentChart');
  const revCtx = document.getElementById('revenueBreakdown');
  const expCtx = document.getElementById('expenseBreakdown');
  const retCtx = document.getElementById('investmentReturns');
  const irrCtx = document.getElementById('irrAnalysis');

  // Sample dummy data for charts — replace with calculated values if needed
  const years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
  const noi = [180000, 190000, 200000, 210000, 220000];
  const debt = [120000, 120000, 120000, 120000, 120000];
  const cashFlow = [60000, 70000, 80000, 90000, 100000];
  const rent = [28, 29, 30, 31, 32];
  const occ = [0.91, 0.92, 0.93, 0.94, 0.95];

  new Chart(projectionCtx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{ label: 'Cash Flow', data: cashFlow, fill: false, borderWidth: 2 }]
    }
  });

  new Chart(noiCtx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        { label: 'NOI', data: noi, backgroundColor: 'rgba(54, 162, 235, 0.5)' },
        { label: 'Debt Service', data: debt, backgroundColor: 'rgba(255, 99, 132, 0.5)' }
      ]
    }
  });

  new Chart(occCtx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        { label: 'Occupancy %', data: occ.map(o => o * 100), yAxisID: 'y1' },
        { label: 'Rent/SF', data: rent, yAxisID: 'y2' }
      ]
    },
    options: {
      scales: {
        y1: { type: 'linear', position: 'left', ticks: { callback: v => v + '%' } },
        y2: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } }
      }
    }
  });

  new Chart(revCtx, {
    type: 'doughnut',
    data: {
      labels: ['Rent', 'CAM', 'Other'],
      datasets: [{ data: [500000, 75000, 20000], backgroundColor: ['#4ade80', '#60a5fa', '#facc15'] }]
    }
  });

  new Chart(expCtx, {
    type: 'doughnut',
    data: {
      labels: ['Taxes', 'Insurance', 'Utilities', 'Repairs', 'Mgmt'],
      datasets: [{ data: [70000, 10000, 15000, 12000, 18000], backgroundColor: ['#f87171', '#fbbf24', '#34d399', '#a78bfa', '#60a5fa'] }]
    }
  });

  new Chart(retCtx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{ label: 'Returns', data: cashFlow, backgroundColor: '#10b981' }]
    }
  });

  new Chart(irrCtx, {
    type: 'line',
    data: {
      labels: ['0%', '5%', '10%', '15%', '20%', '25%'],
      datasets: [{ label: 'IRR Curve', data: [0, 1.1, 1.25, 1.4, 1.55, 1.7], borderWidth: 2 }]
    }
  });
}

// Reset & Demo Buttons
document.getElementById('resetInputs').addEventListener('click', () => {
  document.querySelectorAll('input').forEach(input => input.value = '');
  const summary = document.getElementById('summary-cards');
  if (summary) summary.innerHTML = '';
});

document.getElementById('autofillDemo').addEventListener('click', () => {
  const demoData = {
    buildingSize: 25000,
    landSize: 50000,
    yearBuilt: 2005,
    locationQuality: 'A',
    buildingClass: 'B',
    tenantCount: 12,
    avgRentPerSf: 28,
    occupancyRate: 92,
    avgLeaseTerm: 5,
    rentGrowth: 3,
    renewalProb: 85,
    downtimeMonths: 2,
    camReimbursements: 4,
    otherIncome: 20000,
    realEstateTaxes: 3,
    insurance: 1,
    camExpense: 2,
    managementFee: 4,
    repairsMaint: 1,
    utilities: 1.2,
    otherOpex: 0.6,
    expenseGrowth: 2.5,
    purchasePrice: 6000000,
    closingCosts: 2,
    tiAllowance: 25,
    leasingCommissions: 4,
    loanToValue: 70,
    interestRate: 5.5,
    amortization: 25,
    loanTerm: 10,
    holdPeriod: 5,
    terminalCapRate: 6.25,
    salesCosts: 3,
    capitalReserves: 0.3,
    capitalImprovements: 100000,
    year1Budget: 50000,
    discountRate: 8,
    marketValueGrowth: 3,
    targetIRR: 14
  };

  for (const [id, val] of Object.entries(demoData)) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }
});
