import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { IonicModule } from '@ionic/angular';
import { StreamingEntry } from '../../interfaces/streaming-entry.interface';

@Component({
  selector: 'app-monthly-listening-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, IonicModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <ion-icon name="calendar-outline"></ion-icon>
        <h3>Évolution mensuelle</h3>
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
export class MonthlyListeningChartComponent implements OnChanges {
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
    const monthlyData = this.calculateMonthlyData();

    this.chartOption = {
      backgroundColor: '#1a1a1a',
      title: {
        text: "Temps d'écoute par mois",
        left: 'center',
        textStyle: {
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 'bold',
        },
        top: 10,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1a1a1a',
        borderColor: '#404040',
        textStyle: {
          color: '#ffffff',
        },
        formatter: (params: any) => {
          const data = params[0];
          const hours = Math.round((data.value / (1000 * 60 * 60)) * 100) / 100;
          return `${data.name}<br/>${hours}h d'écoute`;
        },
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(29, 185, 84, 0.1)',
          },
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: monthlyData.map((item) => item.month),
        axisLabel: {
          color: '#b3b3b3',
          fontSize: 10,
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
        name: "Heures d'écoute",
        nameTextStyle: {
          color: '#b3b3b3',
        },
        axisLabel: {
          color: '#b3b3b3',
          formatter: (value: number) => {
            return Math.round((value / (1000 * 60 * 60)) * 100) / 100 + 'h';
          },
        },
        axisLine: {
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
          data: monthlyData.map((item) => item.totalMs),
          type: 'bar',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#1DB954' },
                { offset: 1, color: '#1ED760' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: '#1ED760',
            },
          },
        },
      ],
    };
  }

  private calculateMonthlyData(): Array<{ month: string; totalMs: number }> {
    const monthlyMap = new Map<string, number>();
    const monthNames = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];

    // Filtrer les entrées valides
    const validEntries = this.entries.filter(
      (entry) => !entry.skipped && entry.ms_played > 0
    );

    validEntries.forEach((entry) => {
      const date = new Date(entry.ts);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];
      const displayName = `${monthName} ${date.getFullYear()}`;

      monthlyMap.set(
        displayName,
        (monthlyMap.get(displayName) || 0) + entry.ms_played
      );
    });

    return Array.from(monthlyMap.entries())
      .map(([month, totalMs]) => ({ month, totalMs }))
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split(' ');
        const [monthB, yearB] = b.month.split(' ');
        const yearDiff = parseInt(yearA) - parseInt(yearB);
        if (yearDiff !== 0) return yearDiff;
        return monthNames.indexOf(monthA) - monthNames.indexOf(monthB);
      });
  }
}
