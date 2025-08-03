import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { IonicModule } from '@ionic/angular';
import { StreamingEntry } from '../../interfaces/streaming-entry.interface';

@Component({
  selector: 'app-skipped-ratio-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, IonicModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <ion-icon name="play-skip-forward-outline"></ion-icon>
        <h3>Proportion de morceaux passés</h3>
      </div>
      <div
        echarts
        [options]="chartOption"
        style="height: 350px; width: 100%"
        [loading]="loading"
      ></div>
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
        margin-bottom: 16px;
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

      @media (max-width: 768px) {
        .chart-container {
          padding: 16px;
          border-radius: 12px;
        }

        .chart-header h3 {
          font-size: 16px;
        }
      }
    `,
  ],
})
export class SkippedRatioChartComponent implements OnChanges {
  @Input() entries: StreamingEntry[] = [];

  chartOption: any = {};
  loading = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entries'] && this.entries.length > 0) {
      this.loading = true;
      setTimeout(() => {
        this.updateChart();
        this.loading = false;
      }, 100);
    }
  }

  private updateChart() {
    const skippedData = this.calculateSkippedRatio();

    this.chartOption = {
      backgroundColor: '#1a1a1a',
      title: {
        text: 'Proportion de morceaux passés',
        left: 'center',
        textStyle: {
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 'bold',
        },
        top: 10,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1a1a1a',
        borderColor: '#404040',
        textStyle: {
          color: '#ffffff',
        },
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          color: '#b3b3b3',
          fontSize: 11,
        },
        data: ['Écoutés', 'Passés'],
      },
      series: [
        {
          name: 'Morceaux',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          data: [
            {
              name: 'Écoutés',
              value: skippedData.completed,
              itemStyle: { color: '#1DB954' },
            },
            {
              name: 'Passés',
              value: skippedData.skipped,
              itemStyle: { color: '#FF6B6B' },
            },
          ],
          itemStyle: {
            borderRadius: 6,
            borderColor: '#1a1a1a',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  }

  private calculateSkippedRatio(): { skipped: number; completed: number } {
    let skipped = 0;
    let completed = 0;

    this.entries.forEach((entry) => {
      if (entry.skipped) {
        skipped++;
      } else {
        completed++;
      }
    });

    return { skipped, completed };
  }
}
