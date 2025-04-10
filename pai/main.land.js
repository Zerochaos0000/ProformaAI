document.getElementById("calculate").addEventListener("click", calculateProforma);

function calculateProforma() {
  const lots = parseFloat(document.getElementById("lots").value) || 0;
  const pricePerLot = parseFloat(document.getElementById("pricePerLot").value) || 0;
  const siteCosts = parseFloat(document.getElementById("siteCosts").value) || 0;
  const loanAmount = parseFloat(document.getElementById("loanAmount").value) || 0;
  const loanRate = parseFloat(document.getElementById("loanRate").value) / 100 || 0;
  const loanTerm = parseFloat(document.getElementById("loanTerm").value) || 1;

  const annualInterest = loanAmount * loanRate;
  const totalLoanPayback = loanAmount + (annualInterest * loanTerm);

  const annualLots = lots / 5;
  const lotSaleEscalation = 0.03; // 3% annual increase
  const siteCostEscalation = 0.02; // 2% annual increase

  let table = `
    <table class="w-full text-sm text-left border border-gray-300 mt-4">
      <thead class="bg-blue-100">
        <tr>
          <th class="px-4 py-2">Year</th>
          <th class="px-4 py-2">Lots Sold</th>
          <th class="px-4 py-2">Price/Lot</th>
          <th class="px-4 py-2">Gross Revenue</th>
          <th class="px-4 py-2">Site Cost</th>
          <th class="px-4 py-2">Net Cash Flow</th>
        </tr>
      </thead>
      <tbody>
  `;

  const revenues = [], costs = [], netFlows = [];
  let totalRev = 0, totalCost = 0, totalFlow = 0;

  for (let i = 0; i < 5; i++) {
    const lotPrice = pricePerLot * Math.pow(1 + lotSaleEscalation, i);
    const revenue = lotPrice * annualLots;
    const cost = siteCosts * Math.pow(1 + siteCostEscalation, i);
    const net = revenue - cost;

    revenues.push(revenue);
    costs.push(cost);
    netFlows.push(net);

    totalRev += revenue;
    totalCost += cost;
    totalFlow += net;

    table += `
      <tr class="border-t">
        <td class="px-4 py-2">Year ${i + 1}</td>
        <td class="px-4 py-2">${annualLots.toFixed(0)}</td>
        <td class="px-4 py-2">$${lotPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
        <td class="px-4 py-2">$${revenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
        <td class="px-4 py-2">$${cost.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
        <td class="px-4 py-2 font-bold text-blue-700">$${net.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
      </tr>
    `;
  }

  table += `</tbody></table>`;

  document.getElementById("results").innerHTML = `
    <div class="my-4">
      <p><strong>Total Revenue (5 Yr):</strong> $${totalRev.toLocaleString()}</p>
      <p><strong>Total Site Costs (5 Yr):</strong> $${totalCost.toLocaleString()}</p>
      <p><strong>Loan Payback:</strong> $${totalLoanPayback.toLocaleString()}</p>
      <p><strong>Net Project Profit:</strong> <span class="text-green-700 font-bold">$${(totalFlow - totalLoanPayback).toLocaleString()}</span></p>
    </div>
    ${table}
    <canvas id="chart" height="100" class="mt-10"></canvas>
  `;

  renderChart(revenues, costs, netFlows);
}

function renderChart(rev, cost, flow) {
  const ctx = document.getElementById("chart").getContext("2d");
  if (window.myChart) window.myChart.destroy();

  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
      datasets: [
        { label: "Revenue", data: rev, backgroundColor: "#3b82f6" },
        { label: "Costs", data: cost, backgroundColor: "#f87171" },
        { label: "Net Cash Flow", data: flow, backgroundColor: "#10b981" },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}
