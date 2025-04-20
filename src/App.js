import React, { useState, useEffect } from 'react';
import './App.css';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import Papa from 'papaparse';
import {
  Chart as ChartJS,CategoryScale,LinearScale,PointElement,LineElement,BarElement,ArcElement,Title,Tooltip,Legend,
} from 'chart.js';
ChartJS.register(
  CategoryScale,LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,Title,Tooltip,Legend
);

function App() {
  const [chartData, setChartData] = useState({
    vehicleData: null,
    energyData: null,
    stationData: null,
    usageData: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalVehicleCount: 0,
    avgRange: 0,
    uniqueMakesCount: 0,
    bevcount: 0,
    phevcount: 0
  });

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch('/data-to-visualize/Electric_Vehicle_Population_Data.csv');
        const csvData = await response.text();
        
        Papa.parse(csvData, {
          header: true,
          complete: (results) => {
            const data = results.data.filter(row => Object.keys(row).length > 1); 
            processData(data);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching CSV:', error);
        setIsLoading(false);
      }
    };
    
    const processData = (data) => {
      const vehiclesByYear = {};
      data.forEach(row => {
        const year = row['Model Year'];
        if (year && !isNaN(year)) {
          vehiclesByYear[year] = (vehiclesByYear[year] || 0) + 1;
        }
      });
      const sortedYears = Object.keys(vehiclesByYear).sort();
      const vehicleCounts = sortedYears.map(year => vehiclesByYear[year]);
      const energyByYear = {};
      let totalVehicles = 0;
      data.forEach(row => {
        const year = row['Model Year'];
        const range = parseFloat(row['Electric Range']);
        if (year && !isNaN(year) && !isNaN(range)) {
          if (!energyByYear[year]) {
            energyByYear[year] = { total: 0, count: 0 };
          }
          energyByYear[year].total += range;
          energyByYear[year].count += 1;
          totalVehicles += 1;
        }
      });
      
      const avgEnergyByYear = {};
      Object.keys(energyByYear).forEach(year => {
        avgEnergyByYear[year] = energyByYear[year].total / energyByYear[year].count;
      });
      
      const sortedEnergyYears = Object.keys(avgEnergyByYear).sort();
      const avgEnergyCounts = sortedEnergyYears.map(year => avgEnergyByYear[year]);
     
      const stationsByCounty = {};
      data.forEach(row => {
        const county = row['County'];
        if (county) {
          stationsByCounty[county] = (stationsByCounty[county] || 0) + 1;
        }
      });
      const topCounties = Object.keys(stationsByCounty)
        .sort((a, b) => stationsByCounty[b] - stationsByCounty[a])
        .slice(0, 5);
      
      const countyData = topCounties.map(county => stationsByCounty[county]);
   
      const usageByType = {};
      data.forEach(row => {
        const type = row['Electric Vehicle Type'];
        if (type) {
          usageByType[type] = (usageByType[type] || 0) + 1;
        }
      });
      
      const vehicleTypes = Object.keys(usageByType);
      const typeCounts = vehicleTypes.map(type => usageByType[type]);
      

      const totalVehicleCount = data.length;

      let totalRange = 0;
      let rangeCount = 0;
      data.forEach(row => {
        const range = parseFloat(row['Electric Range']);
        if (!isNaN(range) && range > 0) {
          totalRange += range;
          rangeCount++;
        }
      });
      const avgRange = rangeCount > 0 ? Math.round(totalRange / rangeCount) : 0;
      const uniqueMakes = new Set();
      data.forEach(row => {
        if (row['Make']) {
          uniqueMakes.add(row['Make']);
        }
      });
      let bevcount = 0;
      let phevcount = 0;
      data.forEach(row => {
        if (row['Electric Vehicle Type'] && row['Electric Vehicle Type'].includes('BEV')) {
          bevcount++;
        } else if (row['Electric Vehicle Type'] && row['Electric Vehicle Type'].includes('PHEV')) {
          phevcount++;
        }
      });
      setDashboardMetrics({
        totalVehicleCount,
        avgRange,
        uniqueMakesCount: uniqueMakes.size,
        bevcount,
        phevcount
      });
      setChartData({
        vehicleData: {
          labels: sortedYears,
          datasets: [{
            label: 'Total Vehicles',
            data: vehicleCounts,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }]
        },
        energyData: {
          labels: sortedEnergyYears,
          datasets: [{
            label: 'Average Electric Range (miles)',
            data: avgEnergyCounts,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        stationData: {
          labels: topCounties,
          datasets: [{
            label: 'Vehicle Distribution by County',
            data: countyData,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 206, 86)',
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)',
            ],
            borderWidth: 1
          }]
        },
        usageData: {
          labels: vehicleTypes,
          datasets: [{
            label: 'Vehicles by Type',
            data: typeCounts,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1
          }]
        }
      });
      setIsLoading(false);
    };
loadCSVData();
  }, []);

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Vehicle Registration by Year',
      },
    },
  };
const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Average Electric Range by Year',},},};
  
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Vehicle Distribution by County',
      },
    },
  };
const hourlyOptions = {
    responsive: true,
    plugins: {legend: {position: 'top',},
      title: {display: true,text: 'Vehicles by Type',},},
    scales: {
      y: {beginAtZero: true,title: {display: true,text: 'Count'}},
      x: {title: {display: true,text: 'Vehicle Type'}}}};
  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>EV Analytics Dashboard</h1>
        </div>
       </nav>
  <main className="content">
        <section id="dashboard" className="dashboardcont">
          <h2>EV Analytics Overview</h2>
          {isLoading ? (
            <div className="loading-spinner">Loading...</div>
          ) : (
            <>
              <div className="dasboardgrid single-row">
                <div className="dashboardcard">
                  <h3>Total Vehicles</h3>
                  <p className="metric">{dashboardMetrics.totalVehicleCount.toLocaleString()}</p>
                  <p className="trend positive">From {dashboardMetrics.totalVehicleCount} records</p>
                </div>
                <div className="dashboardcard">
                  <h3>Average Electric Range</h3>
                  <p className="metric">{dashboardMetrics.avgRange} miles</p>
                  <p className="trend neutral">Based on available data</p>
                </div>
                <div className="dashboardcard">
                  <h3>Unique Manufacturers</h3>
                  <p className="metric">{dashboardMetrics.uniqueMakesCount}</p>
                  <p className="trend positive">Different EV makers</p>
                </div>
                <div className="dashboardcard">
                  <h3>BEV vs PHEV Ratio</h3>
                  <p className="metric">
                    {Math.round((dashboardMetrics.bevcount / (dashboardMetrics.bevcount + dashboardMetrics.phevcount)) * 100)}%
                  </p>
                  <p className="trend neutral">{dashboardMetrics.bevcount} BEVs, {dashboardMetrics.phevcount} PHEVs</p>
                </div>
              </div>
              <div className="data-table-container">
                <h3>Key EV Metrics Table</h3>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Value</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Total EV Population</td>
                        <td>{dashboardMetrics.totalVehicleCount.toLocaleString()}</td>
                        <td>Complete dataset records</td>
                      </tr>
                      <tr>
                        <td>Battery Electric Vehicles (BEVs)</td>
                        <td>{dashboardMetrics.bevcount.toLocaleString()}</td>
                        <td>{Math.round((dashboardMetrics.bevcount / dashboardMetrics.totalVehicleCount) * 100)}% of total</td>
                      </tr>
                      <tr>
                        <td>Plug-in Hybrid Vehicles (PHEVs)</td>
                        <td>{dashboardMetrics.phevcount.toLocaleString()}</td>
                        <td>{Math.round((dashboardMetrics.phevcount / dashboardMetrics.totalVehicleCount) * 100)}% of total</td>
                      </tr>
                      <tr>
                        <td>Average Electric Range</td>
                        <td>{dashboardMetrics.avgRange} miles</td>
                        <td>Across all vehicle types</td>
                      </tr>
                      <tr>
                        <td>Unique Manufacturers</td>
                        <td>{dashboardMetrics.uniqueMakesCount}</td>
                        <td>Diverse market participation</td>
                      </tr>
                      <tr>
                        <td>Top County</td>
                        <td>{chartData.stationData?.labels[0] || 'N/A'}</td>
                        <td>{chartData.stationData?.datasets[0]?.data[0]?.toLocaleString() || 0} vehicles</td>
                      </tr>
                      <tr>
                        <td>Second County</td>
                        <td>{chartData.stationData?.labels[1] || 'N/A'}</td>
                        <td>{chartData.stationData?.datasets[0]?.data[1]?.toLocaleString() || 0} vehicles</td>
                      </tr>
                      <tr>
                        <td>BEV to PHEV Ratio</td>
                        <td>{(dashboardMetrics.bevcount / dashboardMetrics.phevcount).toFixed(2)}</td>
                        <td>BEVs per PHEV</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="chartscont">
                <div className="chartrow">
                  <div className="chartwrapper half-width">
                    <Bar data={chartData.vehicleData} options={barOptions} />
                    <p className="chartinfo">The growth trend of electric vehicles over time is demonstrated by vehicle registrations by model year, with newer models gaining popularity.</p>
                  </div>
                  <div className="chartwrapper half-width">
                    <Line data={chartData.energyData} options={lineOptions} />
                    <p className="chartinfo">As battery technology has advanced and range anxiety issues have been resolved, the average electric range has been rising steadily over time.</p>
                  </div>
                </div>
                <div className="chartrow">
                  <div className="chartwrapper minichart pie-chart-container">
                    <Pie data={chartData.stationData} options={{...pieOptions, maintainAspectRatio: true}} />
                    <p className="chartinfo">The distribution of EVs by county reveals a concentration in cities, which is indicative of adoption trends and the availability of charging infrastructure.</p>
                  </div>
                  <div className="chartwrapper minichart doughnut-chart-container">
                    <Doughnut data={chartData.stationData} options={{...pieOptions, maintainAspectRatio: true}} />
                    <p className="chartinfo">Potential locations for infrastructure development to support the increasing adoption of EVs in underrepresented areas are highlighted by county distribution.</p>
                  </div>
                </div>
                <div className="chartwrapper medium-width-chart">
                  <Bar data={chartData.usageData} options={hourlyOptions} />
                  <p className="chartinfo">The market share between plug-in hybrid electric vehicles (PHEVs) and battery electric vehicles (BEVs) is displayed by vehicle type, revealing consumer preferences.</p>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
      <footer className="footer">
      <div className="footertext"><p>© 2025 EV Analytics Dashboard. All rights reserved.</p></div></footer></div>
  );}
export default App;