import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { IonicModule } from '@ionic/angular';
import { StreamingEntry } from '../../interfaces/streaming-entry.interface';

@Component({
  selector: 'app-skipped-top-artists-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, IonicModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <ion-icon name="close-circle-outline"></ion-icon>
        <h3>Artistes les Plus Passés</h3>
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
        color: #ff6b6b;
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
export class SkippedTopArtistsChartComponent implements OnChanges {
  @Input() entries: StreamingEntry[] = [];

  chartOption: any = {};

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entries'] && this.entries.length > 0) {
      this.updateChart();
    }
  }

  private updateChart() {
    const skippedArtistsData = this.calculateSkippedTopArtists();

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
          const totalSkipped = skippedArtistsData.reduce(
            (sum, item) => sum + item.skipCount,
            0
          );
          const percentage = ((data.value / totalSkipped) * 100).toFixed(1);
          return `${data.name}<br/>${data.value} skips (${percentage}%)`;
        },
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '15%',
        right: '5%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
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
      yAxis: {
        type: 'category',
        data: skippedArtistsData.map((item) => item.name),
        axisLabel: {
          color: '#b3b3b3',
          fontSize: 11,
          width: 80,
          overflow: 'truncate',
          formatter: (value: string) => {
            return value.length > 12 ? value.substring(0, 12) + '...' : value;
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
          name: 'Skips',
          type: 'bar',
          data: skippedArtistsData.map((item, index) => ({
            value: item.skipCount,
            itemStyle: {
              color: this.getBarColor(index),
            },
          })),
          barWidth: '60%',
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
    };
  }

  private calculateSkippedTopArtists() {
    const artistSkipMap = new Map<string, number>();

    // Filtrer seulement les entrées skippées
    const skippedEntries = this.entries.filter(
      (entry) =>
        entry.skipped === true && entry.master_metadata_album_artist_name
    );

    skippedEntries.forEach((entry) => {
      const artistName = entry.master_metadata_album_artist_name;
      const existing = artistSkipMap.get(artistName) || 0;
      artistSkipMap.set(artistName, existing + 1);
    });

    // Trier par nombre de skips décroissant et prendre les 10 premiers
    const sortedArtists = Array.from(artistSkipMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return sortedArtists.map(([name, skipCount]) => ({
      name,
      skipCount,
    }));
  }

  private getBarColor(index: number): string {
    const colors = [
      '#FF6B6B', // Rouge pour les skips
      '#FF8E8E', // Rouge plus clair
      '#FFB3B3', // Rouge très clair
      '#FFD6D6', // Rose clair
      '#FFE6E6', // Rose très clair
      '#FF4757', // Rouge vif
      '#FF3838', // Rouge foncé
      '#FF5252', // Rouge moyen
      '#FF6B9D', // Rose-rouge
      '#FF8A80', // Rouge-orange
    ];
    return colors[index] || colors[0];
  }
}
