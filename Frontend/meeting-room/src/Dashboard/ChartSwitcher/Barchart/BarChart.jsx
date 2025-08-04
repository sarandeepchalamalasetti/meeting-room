import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BarChart = ({ data = [], loading = false, filterLabel = '' }) => {
  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%', 
        width: '100%',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        📊 Loading chart data{filterLabel ? ` ${filterLabel}` : ''}...
      </div>
    );
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%', 
        width: '100%',
        color: '#6b7280',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '0.875rem'
      }}>
        <div style={{ fontSize: '2rem' }}>📊</div>
        <div>No booking data available{filterLabel ? ` ${filterLabel}` : ''}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
          {filterLabel ? 'Try a different time period' : 'Create your first booking to see trends'}
        </div>
      </div>
    );
  }

  // Prepare chart data from live user data
  const labels = data.map(dayData => dayData.day);
  const approvedData = data.map(dayData => dayData.approved);
  const pendingData = data.map(dayData => dayData.pending);
  const rejectedData = data.map(dayData => dayData.rejected);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: false 
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const dayIndex = context[0].dataIndex;
            const title = `${labels[dayIndex]} - ${data[dayIndex].date}`;
            return filterLabel ? `${title} (${filterLabel})` : title;
          },
          label: (context) => {
            const datasetLabel = context.dataset.label;
            const value = context.raw;
            const total = approvedData[context.dataIndex] + 
                         pendingData[context.dataIndex] + 
                         rejectedData[context.dataIndex];
            
            if (value === 0) {
              return `${datasetLabel}: No bookings`;
            }
            
            return `${datasetLabel}: ${value} booking${value !== 1 ? 's' : ''} (${total} total)`;
          },
          afterBody: (context) => {
            const dayIndex = context[0].dataIndex;
            const total = approvedData[dayIndex] + pendingData[dayIndex] + rejectedData[dayIndex];
            if (total === 0) {
              return 'No bookings made on this day';
            }
            const footerText = `Total bookings: ${total}`;
            return filterLabel ? `${footerText} ${filterLabel}` : footerText;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: { 
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          },
          color: '#6b7280',
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: `Number of Bookings${filterLabel ? ` (${filterLabel})` : ''}`,
          color: '#374151',
          font: {
            size: 12,
            weight: '500'
          }
        },
        grid: {
          color: '#f1f5f9'
        }
      },
      x: {
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: filterLabel === 'Today' ? 'Hours of Today' : 
                filterLabel && filterLabel.includes('for') ? 'Time Period' : 
                'Day of Week (Last 7 Days)',
          color: '#374151',
          font: {
            size: 12,
            weight: '500'
          }
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    }
  };

  const chartData = {
    labels,
    datasets: [
      { 
        label: "Approved", 
        data: approvedData, 
        backgroundColor: "#10B981",
        borderColor: "#10B981",
        borderWidth: 1,
        borderRadius: 3,
        borderSkipped: false
      },
      { 
        label: "Pending", 
        data: pendingData, 
        backgroundColor: "#F59E0B",
        borderColor: "#F59E0B",
        borderWidth: 1,
        borderRadius: 3,
        borderSkipped: false
      },
      { 
        label: "Rejected", 
        data: rejectedData, 
        backgroundColor: "#EF4444",
        borderColor: "#EF4444",
        borderWidth: 1,
        borderRadius: 3,
        borderSkipped: false
      },
    ],
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default BarChart;