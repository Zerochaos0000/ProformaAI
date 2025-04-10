document.getElementById('calculate').addEventListener('click', calculateProforma);
document.getElementById('exportPdf').addEventListener('click', exportToPDF);
document.getElementById('exportXls').addEventListener('click', exportToExcel);

function parseCurrency(value) {
  if (typeof value !== "string") return +value || 0;
  return +value.replace(/[^0-9.-]+/g, "") || 0;
}

function calculateProforma() {
  const lotCount = parseCurrency(document.getElementById('lotCount').value);
  const salePricePerLot = parseCurrency(document.getElementById('salePricePerLot').value);
  const siteCost = parseCurrency(document.getElementById('siteCost').value);
  const softCost = parseCurrency(document.getElementById('softCost').value);
  const carryingCost = parseCurrency(document.getElementById('carryingCost').value);
  const sellingCost = parseCurrency(document.getElementById('sellingCost').value);
  const landCost = parseCurrency(document.getElementById('landCost').value);
  const permitFees = parseCurrency(document.getElementById('permitFees').value);
  const contingency = parseCurrency(document.getElementById('contingency').value);

  const loanAmount = parseCurrency(document.getElementById('loanAmount').value);
  const loanRate = parseCurrency(document.getElementById('loanRate').value) / 100;
  const amortYears = parseCurrency(document.getElementById('loanAmort').value) || 30;

  const revenue = lotCount * salePricePerLot;
  const totalCost = siteCost + softCost + carryingCost + sellingCost + landCost + permitFees + contingency;

  const monthlyRate = loanRate / 12;
  const numPayments = amortYears * 12;

  const annualDebtService = loanAmount > 0
    ? (loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments))) * 12
    : 0;

  const cashFlow = revenue - totalCost - annualDebtService;
  const dscr = annualDebtService > 0 ? ((revenue - totalCost) / annualDebtService).toFixed(2) : "N/A";

  // Update summary UI
  document.getElementById('totalRevenue').innerText = `$${revenue.toLocaleString()}`;
  document.getElementById('totalCost').innerText = `$${totalCost.toLocaleString()}`;
  document.getElementById('profit').innerText = `$${(revenue - totalCost).toLocaleString()}`;
  document.getElementById('annualDebtService').innerText = `$${annualDebtService.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  document.getElementById('cashFlow').innerText = `$${cashFlow.toLocaleString()}`;
  document.getElementById('dscr').innerText = dscr;

  const decision = document.getElementById('decision');
  decision.innerHTML = cashFlow > 0
    ? `<p class='text-green-700 font-semibold'>✅ Project generates positive cash flow.</p>`
    : `<p class='text-red-600 font-semibold'>⚠️ Project may require review due to low returns.</p>`;

  document.getElementById('summary').classList.remove('hidden');

  renderPhasingTable(revenue, totalCost, annualDebtService);
  renderBarChart([revenue, totalCost, annualDebtService], ['Revenue', 'Cost', 'Debt']);
}

function renderPhasingTable(revenue, cost, debt) {
  const container = document.getElementById('phasingTable');
  let html = `
    <table class="min-w-full text-sm text-left border border-gray-300 mt-4">
      <thead class="bg-blue-100">
        <tr>
          <th class="px-4 py-2">Year</th>
          <th class="px-4 py-2">Revenue</th>
          <th class="px-4 py-2">Cost</th>
          <th class="px-4 py-2">Debt Service</th>
          <th class="px-4 py-2">Net</th>
        </tr>
      </thead>
      <tbody>
  `;
  for (let i = 1; i <= 5; i++) {
    const inflator = 1 + i * 0.02;
    const rev = revenue * inflator;
    const exp = cost * inflator;
    const net = rev - exp - debt;
    html += `<tr>
      <td class="px-4 py-2">Year ${i}</td>
      <td class="px-4 py-2">$${rev.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
      <td class="px-4 py-2">$${exp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
      <td class="px-4 py-2">$${debt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
      <td class="px-4 py-2 font-semibold text-green-700">$${net.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
    </tr>`;
  }
  html += '</tbody></table>';
  container.innerHTML = html;
}

function renderBarChart(data, labels) {
  const ctx = document.getElementById('costChart').getContext('2d');
  if (window.chartInstance) window.chartInstance.destroy();
  window.chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Financial Breakdown',
        data: data,
        backgroundColor: ['#3b82f6', '#f87171', '#a78bfa']
      }]
    }
  });
}

function exportToPDF() {
  window.print();
}

function exportToExcel() {
  const table = document.querySelector('#phasingTable table');
  if (!table) return;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, 'Land Proforma');
  XLSX.writeFile(wb, 'Land_Development_Proforma.xlsx');
}
