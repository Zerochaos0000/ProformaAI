document.getElementById('calculate').addEventListener('click', calculateLandProforma);
document.getElementById('exportPdf').addEventListener('click', () => window.print());
document.getElementById('exportXls').addEventListener('click', exportToExcel);

function parseCurrency(value) {
  if (typeof value !== 'string') return +value || 0;
  return +value.replace(/[^0-9.-]+/g, '') || 0;
}

function calculateLandProforma() {
  const lotCount = parseCurrency(document.getElementById('lotCount').value);
  const salePricePerLot = parseCurrency(document.getElementById('salePricePerLot').value);
  const siteCost = parseCurrency(document.getElementById('siteCost').value);
  const softCost = parseCurrency(document.getElementById('softCost').value);
  const carryingCost = parseCurrency(document.getElementById('carryingCost').value);
  const sellingCost = parseCurrency(document.getElementById('sellingCost').value);
  const landCost = parseCurrency(document.getElementById('landCost').value);
  const permitFees = parseCurrency(document.getElementById('permitFees').value);
  const contingency = parseCurrency(document.getElementById('contingency').value);

  const loanAmount = parseCurrency(document.getElementById('loanAmount')?.value) || 0;
  const loanRate = parseCurrency(document.getElementById('loanRate')?.value) / 100 || 0;
  const loanAmort = parseCurrency(document.getElementById('loanAmort')?.value) || 30;

  const monthlyRate = loanRate / 12;
  const numPayments = loanAmort * 12;
  const annualDebtService = loanAmount > 0
    ? (loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments))) * 12
    : 0;

  const totalRevenue = lotCount * salePricePerLot;
  const totalCost = siteCost + softCost + carryingCost + sellingCost + landCost + permitFees + contingency;
  const profit = totalRevenue - totalCost;
  const cashFlow = profit - annualDebtService;
  const dscr = annualDebtService > 0 ? (profit / annualDebtService).toFixed(2) : 'N/A';

  let decisionNote = '';
  if (profit > 1000000 && dscr !== 'N/A' && dscr > 1.2) {
    decisionNote = `<p class='text-green-600 font-semibold mt-3'>✅ Project is profitable and debt service coverage is acceptable.</p>`;
  } else {
    decisionNote = `<p class='text-red-600 font-semibold mt-3'>⚠️ Profit margins or debt coverage may be low – review your assumptions.</p>`;
  }

  document.getElementById('totalRevenue').innerText = `$${totalRevenue.toLocaleString()}`;
  document.getElementById('totalCost').innerText = `$${totalCost.toLocaleString()}`;
  document.getElementById('profit').innerText = `$${profit.toLocaleString()}`;
  document.getElementById('annualDebtService').innerText = `$${Math.round(annualDebtService).toLocaleString()}`;
  document.getElementById('cashFlow').innerText = `$${Math.round(cashFlow).toLocaleString()}`;
  document.getElementById('dscr').innerText = dscr;

  document.getElementById('decision').innerHTML = decisionNote;
  document.getElementById('summary').classList.remove('hidden');

  renderCostChart([
    siteCost, softCost, carryingCost, sellingCost, landCost, permitFees, contingency
  ]);

  renderPhasingTable(totalRevenue);
}

function renderCostChart(data) {
  const ctx = document.getElementById('costChart').getContext('2d');
  if (window.costChart) window.costChart.destroy();

  window.costChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [
        'Site Cost', 'Soft Cost', 'Carrying Cost', 'Selling Cost',
        'Land Cost', 'Permit Fees', 'Contingency'
      ],
      datasets: [{
        data: data,
        backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#6b7280']
      }]
    }
  });
}

function renderPhasingTable(totalRevenue) {
  const container = document.getElementById('phasingTable');
  let html = `
    <h3 class="text-lg font-bold mb-2">📅 5-Year Revenue Projection (2% growth)</h3>
    <table class="w-full text-sm border">
      <thead class="bg-blue-100"><tr><th class="px-4 py-2">Year</th><th class="px-4 py-2">Projected Revenue</th></tr></thead>
      <tbody>
  `;

  for (let i = 1; i <= 5; i++) {
    const revenue = totalRevenue * Math.pow(1.02, i - 1);
    html += `<tr class="border-t"><td class="px-4 py-2">Year ${i}</td><td class="px-4 py-2">$${Math.round(revenue).toLocaleString()}</td></tr>`;
  }

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function exportToExcel() {
  const table = document.querySelector('#phasingTable table');
  if (!table) return alert("Please calculate first.");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, '5-Year Revenue');
  XLSX.writeFile(wb, 'Land_Proforma_5yr.xlsx');
}
