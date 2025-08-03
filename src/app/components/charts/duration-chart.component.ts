import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { IonicModule } from '@ionic/angular';
import { StreamingEntry } from '../../interfaces/streaming-entry.interface';

@Component({
  selector: 'app-duration-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, IonicModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <ion-icon name="time-outline"></ion-icon>
        <h3>Distribution des Durées</h3>
      </div>
      <div echarts [options]="chartOption" class="chart"></div>
    </div>
  `,
  styles: [
    `
      .chart-container {
        background: var(--ion-color-secondary);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        border: 1px solid var(--ion-color-tertiary);
        transition: all 0.3s ease-in-out;
      }

      .chart-container:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
      }

      .chart-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--ion-color-tertiary);
      }

      .chart-header ion-icon {
        font-size: 24px;
        color: var(--ion-color-primary);
        margin-right: 12px;
      }

      .chart-header h3 {
        margin: 0;
        color: var(--ion-color-light);
        font-size: 18px;
        font-weight: 600;
      }

      .chart {
        height: 300px;
        width: 100%;
      }

      @media (max-width: 768px) {
        .chart-container {
          padding: 16px;
          border-radius: 12px;
        }

        .chart-header h3 {
          font-size: 16px;
        }

        .chart {
          height: 250px;
        }
      }
    `,
  ],
})
export class DurationChartComponent implements OnChanges {
  @Input() entries: StreamingEntry[] = [];

  chartOption: any = {};

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entries'] && this.entries.length > 0) {
      this.updateChart();
    }
  }

  private updateChart() {
    const durationData = this.calculateDurationDistribution();

    this.chartOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textStyle: {
          color: '#ffffff',
        },
        formatter: (params: any) => {
          const data = params[0];
          const percentage = ((data.value / this.entries.length) * 100).toFixed(
            1
          );
          return `${data.name}<br/>${data.value} écoutes (${percentage}%)`;
        },
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: durationData.map((item) => item.category),
        axisLabel: {
          color: '#b3b3b3',
          fontSize: 11,
          interval: 0,
          rotate: 45,
        },
        axisLine: {
          lineStyle: {
            color: '#333333',
          },
        },
        axisTick: {
          lineStyle: {
            color: '#333333',
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#b3b3b3',
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: '#333333',
          },
        },
        axisTick: {
          lineStyle: {
            color: '#333333',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#333333',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: "Nombre d'écoutes",
          type: 'bar',
          data: durationData.map((item) => ({
            value: item.count,
            itemStyle: {
              color: this.getBarColor(item.category),
            },
          })),
          barWidth: '70%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }

  private calculateDurationDistribution() {
    const categories = [
      { name: '< 30s', min: 0, max: 30 * 1000, count: 0 },
      { name: '30s - 1min', min: 30 * 1000, max: 60 * 1000, count: 0 },
      { name: '1-3min', min: 60 * 1000, max: 3 * 60 * 1000, count: 0 },
      { name: '3-10min', min: 3 * 60 * 1000, max: 10 * 60 * 1000, count: 0 },
      { name: '> 10min', min: 10 * 60 * 1000, max: Infinity, count: 0 },
    ];

    // Filtrer les entrées valides
    const validEntries = this.entries.filter((entry) => entry.ms_played > 0);

    validEntries.forEach((entry) => {
      const duration = entry.ms_played;

      for (const category of categories) {
        if (duration >= category.min && duration < category.max) {
          category.count++;
          break;
        }
      }
    });

    return categories.map((cat) => ({
      category: cat.name,
      count: cat.count,
    }));
  }

  private getBarColor(category: string): string {
    const colors = {
      '< 30s': '#FF6B6B', // Rouge pour les très courtes
      '30s - 1min': '#FFD93D', // Jaune pour les courtes
      '1-3min': '#6BCF7F', // Vert clair pour les moyennes
      '3-10min': '#4D96FF', // Bleu pour les longues
      '> 10min': '#1DB954', // Vert Spotify pour les très longues
    };

    return colors[category as keyof typeof colors] || '#1DB954';
  }
}
