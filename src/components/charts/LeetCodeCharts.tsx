import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { useLeetCodeStore } from '../../lib/stores/leetcode-store';
import { Flame } from 'lucide-react';

// Register Chart.js components for tree-shaking
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DIFFICULTY_COLORS = {
  easy: '#22c55e',
  medium: '#f97316',
  hard: '#ef4444',
};

export function ProgressLineChart() {
  const progressData = useLeetCodeStore((s) => s.getProgressByDate());

  if (progressData.length < 2) {
    return (
      <p className="text-caption text-center py-8 text-[var(--color-text-secondary)]">
        Need at least 2 days of data to show progress chart
      </p>
    );
  }

  const data = {
    labels: progressData.map((d) => d.date.slice(5)), // MM-DD format
    datasets: [
      {
        label: 'Problems Solved',
        data: progressData.map((d) => d.count),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11 },
        },
        grid: { color: 'rgba(128,128,128,0.1)' },
      },
    },
  };

  return (
    <div className="h-48">
      <Line data={data} options={options} />
    </div>
  );
}

export function DifficultyPieChart() {
  const stats = useLeetCodeStore((s) => s.getStatsByDifficulty());
  const total = stats.easy + stats.medium + stats.hard;

  if (total === 0) {
    return (
      <p className="text-caption text-center py-8 text-[var(--color-text-secondary)]">
        No problems solved yet
      </p>
    );
  }

  const data = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        data: [stats.easy, stats.medium, stats.hard],
        backgroundColor: [
          DIFFICULTY_COLORS.easy,
          DIFFICULTY_COLORS.medium,
          DIFFICULTY_COLORS.hard,
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        callbacks: {
          label: (tooltipItem) => {
            const value = tooltipItem.parsed as number;
            const pct = ((value / total) * 100).toFixed(0);
            return `${tooltipItem.label}: ${value} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-48">
      <Doughnut data={data} options={options} />
    </div>
  );
}

export function PatternBarChart() {
  const patternStats = useLeetCodeStore((s) => s.getStatsByPattern());
  const sortedPatterns = Object.entries(patternStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8); // Top 8 patterns

  if (sortedPatterns.length === 0) {
    return (
      <p className="text-caption text-center py-8 text-[var(--color-text-secondary)]">
        No patterns recorded yet
      </p>
    );
  }

  const data = {
    labels: sortedPatterns.map(([pattern]) => pattern),
    datasets: [
      {
        label: 'Problems',
        data: sortedPatterns.map(([, count]) => count),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        barThickness: 20,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11 },
        },
        grid: { color: 'rgba(128,128,128,0.1)' },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <div className="h-48">
      <Bar data={data} options={options} />
    </div>
  );
}

export function StreakDisplay() {
  const streak = useLeetCodeStore((s) => s.getStreak());

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[var(--color-surface-primary)] rounded-[var(--radius-md)] h-full min-h-[100px]">
      <Flame
        className={`w-8 h-8 mb-2 ${
          streak > 0 ? 'text-[var(--color-accent-orange)]' : 'text-[var(--color-text-tertiary)]'
        }`}
      />
      <p className="text-headline-1 font-bold">{streak}</p>
      <p className="text-caption text-[var(--color-text-secondary)]">Day Streak</p>
    </div>
  );
}
