
document.addEventListener('DOMContentLoaded', () => {
  const parse = id => parseFloat(document.getElementById(id).value) || 0;

  document.getElementById('calculate').addEventListener('click', () => {
    const lots = parse('numLots');
    const lotPrice = parse('lotPrice');
    const sitework = parse('sitework');
    const infrastructure = parse('infrastructure');
    const permits = parse('permits');
    const soft = parse('softCosts');
    const contingency = parse('contingency');
    const land = parse('landCost');
    const loan = parse('loanAmount');
    const rate = parse('interestRate') / 100;
    const term = parse('loanTerm');

    const revenue = lots * lotPrice;
    const devCost = sitework + infrastructure + permits + soft + contingency;
    const interest = loan * rate * term;
    const totalCost = devCost + land + interest;
    const profit = revenue - totalCost;
    const equity = totalCost - loan;
    const coc = equity > 0 ? (profit / equity) * 100 : 0;

    render5YearProforma(profit, interest);

    document.getElementById("results").innerHTML = `
      <table class="min-w-full">
        <tr><td class="font-semibold">Gross Revenue</td><td>$${revenue.toLocaleString()}</td></tr>
        <tr><td>Development Cost</td><td>$${devCost.toLocaleString()}</td></tr>
        <tr><td>Land Cost</td><td>$${land.toLocaleString()}</td></tr>
        <tr><td>Interest</td><td>$${interest.toLocaleString()}</td></tr>
        <tr><td>Total Project Cost</td><td>$${totalCost.toLocaleString()}</td></tr>
        <tr><td class="font-semibold">Net Profit</td><td>$${profit.toLocaleString()}</td></tr>
        <tr><td>Cash Invested</td><td>$${equity.toLocaleString()}</td></tr>
        <tr><td>Cash-on-Cash Return</td><td>${coc.toFixed(2)}%</td></tr>
      </table>
    `;

    renderCharts([sitework, infrastructure, permits, soft, contingency], profit);
  });

  document.getElementById('autofillDemo').addEventListener('click', () => {
    const data = {
      totalAcreage: 30, numLots: 72, lotSize: 0.25, lotPrice: 140000, absorptionRate: 5,
      sitework: 2300000, infrastructure: 1050000, permits: 370000, softCosts: 567000, contingency: 328960,
      landCost: 1600000, loanAmount: 2250000, interestRate: 6.25, loanTerm: 2
    };
    Object.keys(data).forEach(id => document.getElementById(id).value = data[id]);
  });

  document.getElementById('resetInputs').addEventListener('click', () => {
    document.querySelectorAll('input').forEach(input => input.value = '');
    document.getElementById('results').innerHTML = '';
  });

  document.getElementById('exportPdf').addEventListener('click', () => {
    const element = document.querySelector('main');
    if (!element) return alert("Please calculate first before exporting.");
    html2canvas(element, { scale: 2, scrollY: 0 }).then(canvas => {
      const pdf = new jspdf.jsPDF('p', 'pt', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const width = pdf.internal.pageSize.getWidth();
      const height = canvas.height * width / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
      pdf.save('Land_Development_Proforma.pdf');
    });
  });

  document.getElementById('exportXls').addEventListener('click', () => {
    const table = document.createElement('table');
    const results = document.getElementById('results');
    if (!results) return alert("Please calculate first before exporting.");
    table.innerHTML = results.innerHTML;
    const wb = XLSX.utils.table_to_book(table, { sheet: "Proforma" });
    XLSX.writeFile(wb, "Land_Development_Proforma.xlsx");
  });
});

function renderCharts(costs, profit) {
  const ctxCost = document.getElementById('costChart').getContext('2d');
  new Chart(ctxCost, {
    type: 'pie',
    data: {
      labels: ['Sitework', 'Utilities', 'Permits', 'Soft', 'Contingency'],
      datasets: [{ data: costs, backgroundColor: ['#3b82f6', '#f97316', '#10b981', '#6366f1', '#ef4444'] }]
    }
  });

  const ctxProj = document.getElementById('projectionChart').getContext('2d');
  let series = [];
  for (let i = 0; i < 5; i++) series.push(profit * Math.pow(1.02, i));
  new Chart(ctxProj, {
    type: 'bar',
    data: {
      labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      datasets: [{ label: 'Projected Profit', data: series, backgroundColor: '#2563eb' }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });
}

function render5YearProforma(profit, debtService) {
  let html = '<h3 class="font-semibold mb-2 mt-6">📆 5-Year Projection</h3>';
  html += '<table class="min-w-full border border-gray-300 text-sm"><thead><tr>';
  html += '<th class="border px-2 py-1">Year</th><th class="border px-2 py-1">Projected Profit</th><th class="border px-2 py-1">Debt Service</th><th class="border px-2 py-1">Cash Flow</th></tr></thead><tbody>';
  let cashFlows = [];
  for (let i = 0; i < 5; i++) {
    const projProfit = profit * Math.pow(1.02, i);
    const cash = projProfit - debtService;
    html += `<tr><td class="border px-2 py-1">Year ${i + 1}</td><td class="border px-2 py-1">$${projProfit.toLocaleString()}</td><td class="border px-2 py-1">$${debtService.toLocaleString()}</td><td class="border px-2 py-1">$${cash.toLocaleString()}</td></tr>`;
    cashFlows.push(cash);
  }
  html += '</tbody></table>';
  const irr = calculateIRR([-debtService * 5, ...cashFlows]) * 100;

  document.getElementById("results").innerHTML += `<p class="mt-4 text-md"><strong>Estimated IRR:</strong> ${
    isNaN(irr) ? 'Not Available' : irr.toFixed(2) + '%'
  }</p>`;
  document.getElementById("results").innerHTML += html;
}

function calculateIRR(cashFlows, guess = 0.1) {
  const maxIterations = 1000;
  const precision = 1e-6;
  let x0 = guess;

  for (let i = 0; i < maxIterations; i++) {
    let x1 = x0 - npvDerivative(cashFlows, x0) / npvSecondDerivative(cashFlows, x0);
    if (Math.abs(x1 - x0) < precision) return x1;
    x0 = x1;
  }
  return NaN;
}

function npvDerivative(cashFlows, rate) {
  return cashFlows.reduce((acc, cf, i) => acc + (-i * cf) / Math.pow(1 + rate, i + 1), 0);
}

function npvSecondDerivative(cashFlows, rate) {
  return cashFlows.reduce((acc, cf, i) => acc + (i * (i + 1) * cf) / Math.pow(1 + rate, i + 2), 0);
}
