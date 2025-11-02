import React, { useEffect, useRef, useState } from 'react';
import { Activity, Cpu, HardDrive, MemoryStick } from 'lucide-react';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface ResourceChartProps {
  data: DataPoint[];
  label: string;
  color: string;
  unit: string;
  icon?: 'cpu' | 'memory' | 'disk' | 'network';
  maxValue?: number;
}

const ResourceChart: React.FC<ResourceChartProps> = ({
  data,
  label,
  color,
  unit,
  icon = 'cpu',
  maxValue = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentValue, setCurrentValue] = useState(0);
  const [avgValue, setAvgValue] = useState(0);

  useEffect(() => {
    if (data.length > 0) {
      const latest = data[data.length - 1].value;
      setCurrentValue(latest);

      const sum = data.reduce((acc, point) => acc + point.value, 0);
      setAvgValue(sum / data.length);
    }
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw chart line
    if (data.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const pointSpacing = width / (data.length - 1);

      data.forEach((point, index) => {
        const x = index * pointSpacing;
        const y = height - (point.value / maxValue) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Fill area under line
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, color + '00');
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }, [data, color, maxValue]);

  const getIcon = () => {
    const iconProps = { size: 24, className: 'text-gray-400' };
    switch (icon) {
      case 'cpu':
        return <Cpu {...iconProps} />;
      case 'memory':
        return <MemoryStick {...iconProps} />;
      case 'disk':
        return <HardDrive {...iconProps} />;
      case 'network':
        return <Activity {...iconProps} />;
      default:
        return <Activity {...iconProps} />;
    }
  };

  const getStatusColor = () => {
    if (currentValue >= 90) return 'text-red-500';
    if (currentValue >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h3 className="text-white font-semibold">{label}</h3>
            <p className="text-gray-400 text-sm">
              Avg: {avgValue.toFixed(1)}
              {unit}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getStatusColor()}`}>
            {currentValue.toFixed(1)}
            <span className="text-lg">{unit}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="w-full rounded"
          style={{ maxHeight: '150px' }}
        />

        {/* Value labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>{maxValue}</span>
          <span>{(maxValue * 0.75).toFixed(0)}</span>
          <span>{(maxValue * 0.5).toFixed(0)}</span>
          <span>{(maxValue * 0.25).toFixed(0)}</span>
          <span>0</span>
        </div>
      </div>

      {/* Time range indicator */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>-{data.length * 2}s</span>
        <span>Now</span>
      </div>
    </div>
  );
};

export default ResourceChart;
