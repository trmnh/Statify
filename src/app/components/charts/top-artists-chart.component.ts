import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { IonicModule } from '@ionic/angular';
import { StreamingEntry } from '../../interfaces/streaming-entry.interface';

@Component({
  selector: 'app-top-artists-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, IonicModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <ion-icon name="people-outline"></ion-icon>
        <h3>Top 10 Artistes</h3>
      </div>
      <div
        echarts
        [options]="chartOption"
        style="height: 400px; width: 100%"
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
export class TopArtistsChartComponent implements OnChanges {
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
    const artistsData = this.calculateTopArtists();

    this.chartOption = {
      backgroundColor: '#1a1a1a',
      title: {
        text: 'Artistes les plus écoutés',
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
          const minutes = Math.round((data.value / (1000 * 60)) % 60);
          return `${data.name}<br/>${hours}h ${minutes}min d'écoute`;
        },
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(29, 185, 84, 0.1)',
          },
        },
      },
      grid: {
        left: '30%',
        right: '8%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
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
      yAxis: {
        type: 'category',
        data: artistsData.map((item) => item.name),
        axisLabel: {
          color: '#b3b3b3',
          fontSize: 12,
          width: 120,
          overflow: 'truncate',
          formatter: (value: string) => {
            return value.length > 15 ? value.substring(0, 15) + '...' : value;
          },
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
      series: [
        {
          data: artistsData.map((item) => item.totalMs),
          type: 'bar',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#1DB954' },
                { offset: 1, color: '#1ED760' },
              ],
            },
            borderRadius: [0, 4, 4, 0],
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

  private calculateTopArtists(): Array<{
    name: string;
    totalMs: number;
    count: number;
  }> {
    const artistMap = new Map<string, { totalMs: number; count: number }>();

    // Filtrer les entrées valides
    const validEntries = this.entries.filter(
      (entry) =>
        !entry.skipped &&
        entry.ms_played > 0 &&
        entry.master_metadata_album_artist_name
    );

    validEntries.forEach((entry) => {
      const artistName = entry.master_metadata_album_artist_name;
      const existing = artistMap.get(artistName) || { totalMs: 0, count: 0 };
      artistMap.set(artistName, {
        totalMs: existing.totalMs + entry.ms_played,
        count: existing.count + 1,
      });
    });

    return Array.from(artistMap.entries())
      .map(([name, stats]) => ({
        name,
        totalMs: stats.totalMs,
        count: stats.count,
      }))
      .sort((a, b) => b.totalMs - a.totalMs)
      .slice(0, 10);
  }
}
