import { Component, computed, ElementRef, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { AppGridComponent } from '@cccteam/ccc-lib/ccc-grid';
import { ColumnConfig, FieldName } from '@cccteam/ccc-lib/types';
import { KendoGridLegacyComponent } from '../../kendo-grid-legacy/kendo-grid-legacy.component';

interface PerfRow {
  id: number;
  name: string;
  email: string;
  role: string;
}

type GridEngine = 'newVirtual' | 'newFlat' | 'legacyVirtual' | 'legacyFlat';

interface BenchmarkResult {
  engine: GridEngine;
  rowCount: number;
  trials: number[];
  median: number;
  min: number;
  max: number;
  domRowCount: number;
}

interface BenchmarkGroup {
  rowCount: number;
  newVirtual?: BenchmarkResult;
  newFlat?: BenchmarkResult;
  legacyVirtual?: BenchmarkResult;
  legacyFlat?: BenchmarkResult;
}

const PLOT_WIDTH_PX = 400;
/** Two animation frames at a typical 60Hz refresh rate — the floor this method can resolve below. */
const MEASUREMENT_FLOOR_MS = Math.round(2000 / 60);
const DATASET_SIZES = [100, 1000, 5000, 20000, 50000];
const DEFAULT_SIZES = [100, 1000, 5000];
const SLOW_SIZE_THRESHOLD = 20000;
const TRIALS_PER_COMBO = 3;
const ROLES = ['Engineer', 'Researcher', 'Mathematician', 'Manager', 'Analyst'];

/**
 * Order matches the fixed categorical slot each engine is assigned in the chart (see
 * kendo-perf.component.scss) so identity stays consistent instead of being re-derived per chart.
 */
const ENGINE_LABELS: Record<GridEngine, string> = {
  newVirtual: 'New ccc-grid (virtualized)',
  newFlat: 'New ccc-grid (no virtualization)',
  legacyVirtual: 'Legacy Kendo grid (virtualized)',
  legacyFlat: 'Legacy Kendo grid (no virtualization)',
};

const ENGINES: GridEngine[] = ['newVirtual', 'newFlat', 'legacyVirtual', 'legacyFlat'];

function buildRows(count: number): PerfRow[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    return {
      id,
      name: `Test User ${id}`,
      email: `test.user.${id}@example.com`,
      role: ROLES[index % ROLES.length],
    };
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

@Component({
  selector: 'app-kendo-perf',
  standalone: true,
  imports: [AppGridComponent, KendoGridLegacyComponent, MatButtonModule, MatCheckboxModule],
  templateUrl: './kendo-perf.component.html',
  styleUrl: './kendo-perf.component.scss',
})
export class KendoPerfComponent {
  readonly datasetSizes = DATASET_SIZES;
  readonly slowSizeThreshold = SLOW_SIZE_THRESHOLD;
  readonly trialsPerCombo = TRIALS_PER_COMBO;
  readonly engineLabels = ENGINE_LABELS;
  readonly measurementFloorMs = MEASUREMENT_FLOOR_MS;

  columnDefs = signal<ColumnConfig[]>([
    { id: 'id' as FieldName, header: 'ID', width: 80 },
    { id: 'name' as FieldName, header: 'Name', width: 220 },
    { id: 'email' as FieldName, header: 'Email', width: 260 },
    { id: 'role' as FieldName, header: 'Role', width: 160 },
  ]);

  selectedSizes = signal<Set<number>>(new Set(DEFAULT_SIZES));
  running = signal(false);
  progressLabel = signal('');
  copyStatus = signal('');
  results = signal<BenchmarkResult[]>([]);
  benchmarkTarget = signal<{ engine: GridEngine; rows: PerfRow[] } | null>(null);

  private readonly mountHost = viewChild<ElementRef<HTMLDivElement>>('mountHost');

  groupedResults = computed<BenchmarkGroup[]>(() => {
    const map = new Map<number, BenchmarkGroup>();
    for (const result of this.results()) {
      const group = map.get(result.rowCount) ?? { rowCount: result.rowCount };
      group[result.engine] = result;
      map.set(result.rowCount, group);
    }
    return [...map.values()].sort((a, b) => a.rowCount - b.rowCount);
  });

  maxMedian = computed(() => Math.max(1, ...this.results().map((r) => r.median)));

  scaledWidth(ms: number): number {
    return (ms / this.maxMedian()) * PLOT_WIDTH_PX;
  }

  /**
   * Attributes the win to three separate causes per dataset size instead of one conflated
   * number: the rendering engine alone (flat vs flat, neither virtualized), each engine's own
   * virtualization gain (its virtual vs its own flat), and a head-to-head of both grids'
   * virtualized modes — so "ours is virtualized and theirs isn't" can't inflate the headline.
   */
  reportSummary = computed(() => {
    const lines: string[] = [];
    for (const group of this.groupedResults()) {
      const { newVirtual, newFlat, legacyVirtual, legacyFlat } = group;
      const rows = group.rowCount.toLocaleString();

      if (newFlat && legacyFlat) {
        const engineSpeedup = legacyFlat.median / newFlat.median;
        lines.push(
          `At ${rows} rows, with virtualization off on both sides, the new engine renders ${engineSpeedup.toFixed(1)}x faster than ` +
            `the legacy grid (${newFlat.median.toFixed(1)}ms vs ${legacyFlat.median.toFixed(1)}ms, both rendering all ${rows} rows to the DOM).`,
        );
      }
      if (newVirtual && newFlat) {
        const speedup = newFlat.median / newVirtual.median;
        lines.push(
          `The new grid's own virtualization is ${speedup.toFixed(1)}x faster than its flat render ` +
            `(${newFlat.median.toFixed(1)}ms → ${newVirtual.median.toFixed(1)}ms, holding the DOM to ${newVirtual.domRowCount.toLocaleString()} rows).`,
        );
      }
      if (legacyVirtual && legacyFlat) {
        const speedup = legacyFlat.median / legacyVirtual.median;
        lines.push(
          `Kendo's own virtual mode is ${speedup.toFixed(1)}x faster than its flat render ` +
            `(${legacyFlat.median.toFixed(1)}ms → ${legacyVirtual.median.toFixed(1)}ms, holding the DOM to ${legacyVirtual.domRowCount.toLocaleString()} rows).`,
        );
      }
      if (newVirtual && legacyVirtual) {
        const speedup = legacyVirtual.median / newVirtual.median;
        lines.push(
          `With virtualization on both sides, the new grid is still ${speedup.toFixed(1)}x faster than Kendo's virtual mode ` +
            `(${newVirtual.median.toFixed(1)}ms vs ${legacyVirtual.median.toFixed(1)}ms).`,
        );
      }
    }
    return lines;
  });

  toggleSize(size: number, event: MatCheckboxChange): void {
    const next = new Set(this.selectedSizes());
    if (event.checked) {
      next.add(size);
    } else {
      next.delete(size);
    }
    this.selectedSizes.set(next);
  }

  async runBenchmark(): Promise<void> {
    if (this.running() || !this.selectedSizes().size) {
      return;
    }
    this.running.set(true);
    this.results.set([]);
    const sizes = this.datasetSizes.filter((size) => this.selectedSizes().has(size));
    const collected: BenchmarkResult[] = [];

    for (const rowCount of sizes) {
      const rows = buildRows(rowCount);
      for (const engine of ENGINES) {
        this.progressLabel.set(`Rendering ${ENGINE_LABELS[engine]} @ ${rowCount.toLocaleString()} rows…`);
        const trials: number[] = [];
        let domRowCount = 0;
        for (let trial = 0; trial < this.trialsPerCombo; trial++) {
          const measurement = await this.measureMount(engine, rows);
          trials.push(measurement.elapsed);
          domRowCount = measurement.domRows;
        }
        collected.push({
          engine,
          rowCount,
          trials,
          median: median(trials),
          min: Math.min(...trials),
          max: Math.max(...trials),
          domRowCount,
        });
        this.results.set([...collected]);
      }
    }

    await this.unmount();
    this.progressLabel.set('');
    this.running.set(false);
  }

  copyReportMarkdown(): void {
    const header = '| Rows | Grid | Median (ms) | Min (ms) | Max (ms) | DOM rows |\n|---|---|---|---|---|---|';
    const rows = this.results()
      .map(
        (r) =>
          `| ${r.rowCount.toLocaleString()} | ${ENGINE_LABELS[r.engine]} | ${r.median.toFixed(1)} | ${r.min.toFixed(1)} | ${r.max.toFixed(1)} | ${r.domRowCount.toLocaleString()} |`,
      )
      .join('\n');
    const summary = this.reportSummary()
      .map((line) => `- ${line}`)
      .join('\n');
    const markdown = `# kendo-perf benchmark report\n\n${header}\n${rows}\n\n## Summary\n\n${summary}\n`;

    navigator.clipboard
      .writeText(markdown)
      .then(() => this.copyStatus.set('Copied!'))
      .catch(() => this.copyStatus.set('Copy failed'));
    setTimeout(() => this.copyStatus.set(''), 2000);
  }

  /**
   * Fully unmounts and remounts the target grid so each trial measures a cold render rather
   * than an incremental change-detection update, then waits two animation frames past the
   * signal write so the measurement covers change detection *and* the committed paint.
   */
  private async measureMount(engine: GridEngine, rows: PerfRow[]): Promise<{ elapsed: number; domRows: number }> {
    await this.unmount();
    const start = performance.now();
    this.benchmarkTarget.set({ engine, rows });
    await nextFrame();
    await nextFrame();
    const elapsed = performance.now() - start;
    const domRows = this.mountHost()?.nativeElement.querySelectorAll('tbody tr').length ?? 0;
    return { elapsed, domRows };
  }

  private async unmount(): Promise<void> {
    this.benchmarkTarget.set(null);
    await nextFrame();
    await nextFrame();
  }
}
