import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ data = { approved: 0, pending: 0, rejected: 0 }, loading = false, filterLabel = '' }) => {
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

  const { approved, pending, rejected } = data;
  const total = approved + pending + rejected;

  // Show empty state if no bookings
  if (total === 0) {
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
        <div style={{ fontSize: '1.5rem' }}>📊</div>
        <div>No bookings to display{filterLabel ? ` ${filterLabel}` : ''}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
          {filterLabel ? 'Try a different time period' : 'Make your first booking to see statistics'}
        </div>
      </div>
    );
  }

  const chartData = {
    labels: ["Approved", "Pending", "Rejected"],
    datasets: [
      {
        data: [approved, pending, rejected],
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
        borderColor: ["#10B981", "#F59E0B", "#EF4444"],
        borderWidth: 2,
        cutout: "70%", /* Increased cutout for smaller chart */
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: false 
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw;
            const percentage = ((value / total) * 100).toFixed(1);
            
            if (value === 0) {
              return `${label}: No bookings`;
            }
            
            return `${label}: ${value} booking${value !== 1 ? 's' : ''} (${percentage}%)`;
          },
          afterLabel: (context) => {
            const value = context.raw;
            if (value === 1) {
              return 'You have 1 booking in this category';
            } else if (value > 1) {
              return `You have ${value} bookings in this category`;
            }
            return 'No bookings in this category';
          },
          title: () => {
            return filterLabel ? `Bookings ${filterLabel}` : 'Your Bookings';
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
    interaction: {
      intersect: false,
    },
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5
      }
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      height: '100%', 
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '200px', /* Limit max width for smaller chart */
      maxHeight: '200px' /* Limit max height for smaller chart */
    }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default DoughnutChart;