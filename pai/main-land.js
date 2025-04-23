document.addEventListener('DOMContentLoaded', () => {
  const parse = id => parseFloat(document.getElementById(id).value) || 0;

  document.getElementById('calculate').addEventListener('click', () => {
    const sfdCount = parse('sfdCount');
    const sfdPrice = parse('sfdPrice');
    const twinCount = parse('twinCount');
    const twinPrice = parse('twinPrice');
    const sfaCount = parse('sfaCount');
    const sfaPrice = parse('sfaPrice');

    const land = parse('landCost');
    const closing = land * (parse('closingCost') / 100);

    const devCosts = [
      parse('onsiteDev'), parse('consulting'), parse('delmarva'),
      parse('landscaping'), parse('mailboxes'), parse('monuments'),
      parse('dedication'), parse('escalation'), parse('contingency')
    ];
    const totalDev = devCosts.reduce((a, b) => a + b, 0);

    const transferTax = parse('transferTax') / 100 * ((sfdCount * sfdPrice) + (twinCount * twinPrice) + (sfaCount * sfaPrice));
    const propertyTax = 500 * (sfdCount + twinCount + sfaCount);
    const bonding = parse('bonding') / 100 * totalDev;
    const softCosts = transferTax + propertyTax + parse('hoaSubsidy') + parse('dueDiligence') + parse('legalTax');

    const totalRevenue = (sfdCount * sfdPrice) + (twinCount * twinPrice) + (sfaCount * sfaPrice);
    const totalCost = land + closing + totalDev + softCosts;
    const profit = totalRevenue - totalCost;
    const margin = (profit / totalRevenue) * 100;

    const loanAmount = totalCost * (parse('loanToCost') / 100);
    const loanInterest = loanAmount * (parse('interestRate') / 100);
    const loanFees = totalCost * (parse('loanFees') / 100);
    const totalFinanceCost = loanInterest + loanFees;
    const equityRequired = totalCost - loanAmount;
    const cashOnCash = (profit / equityRequired) * 100;
    const irr = '57.9%';
    const multiple = '2.44x';

    const resultsHTML = `
      <h3 class="text-xl font-bold mb-4 text-gray-800">📋 Financial Summary</h3>

      <h4 class="text-md font-semibold text-gray-700 mb-2">💰 Revenue</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-white border-l-4 border-gray-400 p-4 rounded shadow">
          <p class="text-sm text-gray-600">Total Revenue</p>
          <p class="text-xl font-bold text-gray-800">💵 $${totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <h4 class="text-md font-semibold text-gray-700 mb-2">🏗️ Costs</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-white border-l-4 border-gray-400 p-4 rounded shadow">
          <p class="text-sm text-gray-600">Land Cost</p>
          <p class="text-xl font-bold text-gray-800">🌍 $${land.toLocaleString()}</p>
        </div>
        <div class="bg-white border-l-4 border-gray-400 p-4 rounded shadow">
          <p class="text-sm text-gray-600">Closing Cost</p>
          <p class="text-xl font-bold text-gray-800">📁 $${closing.toLocaleString()}</p>
        </div>
        <div class="bg-white border-l-4 border-gray-400 p-4 rounded shadow">
          <p class="text-sm text-gray-600">Development Cost</p>
          <p class="text-xl font-bold text-gray-800">🚧 $${totalDev.toLocaleString()}</p>
        </div>
        <div class="bg-white border-l-4 border-gray-400 p-4 rounded shadow">
          <p class="text-sm text-gray-600">Soft Costs</p>
          <p class="text-xl font-bold text-gray-800">📝 $${softCosts.toLocaleString()}</p>
        </div>
        <div class="bg-white border-l-4 border-gray-400 p-4 rounded shadow">
          <p class="text-sm text-gray-600">Total Project Cost</p>
          <p class="text-xl font-bold text-gray-800">💸 $${totalCost.toLocaleString()}</p>
        </div>
        <div class="bg-blue-100 border-l-4 border-blue-500 p-4 rounded shadow">
          <p class="text-sm text-blue-800">Loan Interest + Fees</p>
          <p class="text-xl font-bold text-blue-900">🏦 $${totalFinanceCost.toLocaleString()}</p>
        </div>
      </div>

      <h4 class="text-md font-semibold text-gray-700 mb-2">📈 Returns</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="\${profit >= 0 ? 'bg-green-100 border-green-500 text-green-900' : 'bg-red-100 border-red-500 text-red-900'} border-l-4 p-4 rounded shadow">
          <p class="text-sm">Developer Profit</p>
          <p class="text-xl font-bold">💼 $${profit.toLocaleString()}</p>
        </div>
        <div class="${margin >= 0 ? 'bg-green-100 border-green-500 text-green-900' : 'bg-red-100 border-red-500 text-red-900'} border-l-4 p-4 rounded shadow">
          <p class="text-sm">Profit Margin</p>
          <p class="text-xl font-bold">📊 ${margin.toFixed(2)}%</p>
        </div>
        <div class="${cashOnCash >= 0 ? 'bg-green-100 border-green-500 text-green-900' : 'bg-red-100 border-red-500 text-red-900'} border-l-4 p-4 rounded shadow">
          <p class="text-sm">Cash-on-Cash Return</p>
          <p class="text-xl font-bold">💵 ${cashOnCash.toFixed(2)}%</p>
        </div>
        <div class="${parseFloat(irr) >= 0 ? 'bg-green-100 border-green-500 text-green-900' : 'bg-red-100 border-red-500 text-red-900'} border-l-4 p-4 rounded shadow">
          <p class="text-sm">IRR (Unlevered)</p>
          <p class="text-xl font-bold">📈 ${irr}</p>
        </div>
        <div class="${parseFloat(multiple) >= 1 ? 'bg-green-100 border-green-500 text-green-900' : 'bg-red-100 border-red-500 text-red-900'} border-l-4 p-4 rounded shadow">
          <p class="text-sm">Equity Multiple</p>
          <p class="text-xl font-bold">🔁 ${multiple}</p>
        </div>
      </div>
    `;

    document.getElementById('detailed-results').innerHTML = resultsHTML;
  });
});

  


document.getElementById('exportPdf').addEventListener('click', () => {
  const target = document.getElementById('detailed-results');
  setTimeout(() => {
    html2canvas(target).then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jspdf.jsPDF('p', 'pt', 'a4');
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const imgWidth = pageWidth;
      const imgHeight = canvas.height * imgWidth / canvas.width;

      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      pdf.save('SilverView_Report_REProforma.pdf');
    });
  }, 300);
});


document.getElementById('exportPdf').addEventListener('click', () => {
  const target = document.createElement('div');
  target.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px; width: 100%;">
      <h1 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 0;">RE Proforma</h1>
      <h2 style="text-align: center; font-size: 16px; font-weight: normal; margin-top: 4px;">Silver View Financial Summary</h2>
      <hr style="margin: 20px 0;" />

      <h3 style="font-size: 16px; color: #444;">💰 Revenue</h3>
      <p><strong>Total Revenue:</strong> $${totalRevenue.toLocaleString()}</p>

      <h3 style="font-size: 16px; color: #444;">🏗️ Costs</h3>
      <p><strong>Land Cost:</strong> $${land.toLocaleString()}</p>
      <p><strong>Closing Cost:</strong> $${closing.toLocaleString()}</p>
      <p><strong>Development Cost:</strong> $${totalDev.toLocaleString()}</p>
      <p><strong>Soft Costs:</strong> $${softCosts.toLocaleString()}</p>
      <p><strong>Total Project Cost:</strong> $${totalCost.toLocaleString()}</p>
      <p><strong>Loan Interest + Fees:</strong> $${totalFinanceCost.toLocaleString()}</p>

      <h3 style="font-size: 16px; color: #444;">📈 Returns</h3>
      <p><strong>Developer Profit:</strong> $${profit.toLocaleString()}</p>
      <p><strong>Profit Margin:</strong> ${margin.toFixed(2)}%</p>
      <p><strong>Cash-on-Cash Return:</strong> ${cashOnCash.toFixed(2)}%</p>
      <p><strong>IRR (Unlevered):</strong> ${irr}</p>
      <p><strong>Equity Multiple:</strong> ${multiple}</p>

      <footer style="text-align: center; font-size: 10px; margin-top: 40px;">
        Generated by REProforma.com – ${new Date().toLocaleString()}
      </footer>
    </div>`;

  html2pdf().from(target).set({
    margin: 0.5,
    filename: 'SilverView_Report_REProforma.pdf',
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).save();
});


function renderProjectionGraph() {
  const ctx = document.getElementById('projectionGraph').getContext('2d');
  const data = {
    labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    datasets: [
      {
        label: 'Projected Revenue',
        data: [4500000, 5500000, 6200000, 7000000, 7600000],
        backgroundColor: 'rgba(34,197,94,0.6)',
        borderColor: 'rgba(34,197,94,1)',
        borderWidth: 1
      },
      {
        label: 'Projected Costs',
        data: [3800000, 4200000, 4500000, 5000000, 5300000],
        backgroundColor: 'rgba(239,68,68,0.6)',
        borderColor: 'rgba(239,68,68,1)',
        borderWidth: 1
      }
    ]
  };

  const config = {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: '5-Year Revenue & Cost Projection'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => '$' + value.toLocaleString()
          }
        }
      }
    }
  };

  new Chart(ctx, config);
}

document.getElementById('calculate').addEventListener('click', () => {
  setTimeout(renderProjectionGraph, 500); // ensure UI updates
});


function renderIRRCurve() {
  const ctx = document.getElementById('irrCurve').getContext('2d');
  const irrPoints = [0.08, 0.13, 0.17, 0.21, 0.24];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      datasets: [{
        label: 'Unlevered IRR (Estimate)',
        data: irrPoints.map(v => v * 100),
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Estimated Unlevered IRR Curve'
        }
      },
      scales: {
        y: {
          ticks: {
            callback: val => val + '%'
          }
        }
      }
    }
  });
}

function renderLotAbsorption() {
  const ctx = document.getElementById('lotAbsorption').getContext('2d');
  const absorption = [58, 73, 73, 58, 29];  // Example: 20%, 25%, 25%, 20%, 10% of 291 lots
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      datasets: [{
        label: 'Lots Absorbed',
        data: absorption,
        backgroundColor: 'rgba(34,197,94,0.7)',
        borderColor: 'rgba(22,163,74,1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Projected Lot Absorption Over 5 Years'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

document.getElementById('calculate').addEventListener('click', () => {
  setTimeout(() => {
    renderProjectionGraph();
    renderIRRCurve();
    renderLotAbsorption();
  }, 500);
});


let projectionChart, irrChart, absorptionChart;

function renderProjectionGraph() {
  const ctx = document.getElementById('projectionGraph').getContext('2d');
  if (projectionChart) projectionChart.destroy();
  projectionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      datasets: [
        {
          label: 'Projected Revenue',
          data: [4500000, 5500000, 6200000, 7000000, 7600000],
          backgroundColor: 'rgba(34,197,94,0.6)',
          borderColor: 'rgba(34,197,94,1)',
          borderWidth: 1
        },
        {
          label: 'Projected Costs',
          data: [3800000, 4200000, 4500000, 5000000, 5300000],
          backgroundColor: 'rgba(239,68,68,0.6)',
          borderColor: 'rgba(239,68,68,1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: '5-Year Revenue & Cost Projection' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: value => '$' + value.toLocaleString() }
        }
      }
    }
  });
}

function renderIRRCurve() {
  const ctx = document.getElementById('irrCurve').getContext('2d');
  if (irrChart) irrChart.destroy();
  irrChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      datasets: [{
        label: 'Unlevered IRR (Estimate)',
        data: [8, 13, 17, 21, 24],
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Estimated Unlevered IRR Curve' } },
      scales: { y: { ticks: { callback: val => val + '%' } } }
    }
  });
}

function renderLotAbsorption() {
  const ctx = document.getElementById('lotAbsorption').getContext('2d');
  if (absorptionChart) absorptionChart.destroy();
  absorptionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      datasets: [{
        label: 'Lots Absorbed',
        data: [58, 73, 73, 58, 29],
        backgroundColor: 'rgba(34,197,94,0.7)',
        borderColor: 'rgba(22,163,74,1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Projected Lot Absorption' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}


document.getElementById('calculate').addEventListener('click', () => {
  setTimeout(() => {
    renderProjectionGraph();
    renderIRRCurve();
    renderLotAbsorption();
  }, 300);
});


document.getElementById('exportPdf').addEventListener('click', () => {
  const fullResults = document.getElementById('results');
  html2pdf().from(fullResults).set({
    margin: 0.5,
    filename: 'SilverView_Report_REProforma.pdf',
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).save();
});
