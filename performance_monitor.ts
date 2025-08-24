/**
 * Performance monitoring utility for tracking optimization improvements
 */

interface PerformanceMetrics {
    startTime: number;
    endTime?: number;
    memoryStart?: any;
    memoryEnd?: any;
    operationsCount?: number;
}

export class PerformanceMonitor {
    private metrics = new Map<string, PerformanceMetrics>();
    
    start(operation: string): void {
        this.metrics.set(operation, {
            startTime: performance.now(),
            memoryStart: this.getMemoryUsage(),
            operationsCount: 0
        });
    }
    
    end(operation: string): void {
        const metric = this.metrics.get(operation);
        if (!metric) {
            console.warn(`No start time found for operation: ${operation}`);
            return;
        }
        
        metric.endTime = performance.now();
        metric.memoryEnd = this.getMemoryUsage();
    }
    
    incrementOperations(operation: string, count: number = 1): void {
        const metric = this.metrics.get(operation);
        if (metric) {
            metric.operationsCount = (metric.operationsCount || 0) + count;
        }
    }
    
    getReport(operation: string): string | null {
        const metric = this.metrics.get(operation);
        if (!metric || !metric.endTime) {
            return null;
        }
        
        const duration = metric.endTime - metric.startTime;
        const memoryDiff = metric.memoryEnd && metric.memoryStart 
            ? (metric.memoryEnd.heapUsed - metric.memoryStart.heapUsed) / 1024 / 1024
            : 0;
        
        return `${operation}: ${duration.toFixed(2)}ms, Memory: ${memoryDiff.toFixed(2)}MB, Ops: ${metric.operationsCount || 0}`;
    }
    
    getAllReports(): string[] {
        const reports: string[] = [];
        for (const operation of this.metrics.keys()) {
            const report = this.getReport(operation);
            if (report) {
                reports.push(report);
            }
        }
        return reports;
    }
    
    private getMemoryUsage(): any {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage();
        }
        return null;
    }
    
    reset(): void {
        this.metrics.clear();
    }
}

// Global instance for easy access
export const PERF_MONITOR = new PerformanceMonitor();
