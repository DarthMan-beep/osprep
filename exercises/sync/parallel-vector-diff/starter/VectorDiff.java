public class VectorDiff {
    // Shared accumulator written by every thread — this is the bug to fix.
    static long total;

    public static long sumOfAbsDiff(int[] a, int[] b, int threads)
            throws InterruptedException {
        total = 0;
        int n = a.length;
        int chunk = (n + threads - 1) / threads;
        Thread[] ts = new Thread[threads];
        for (int t = 0; t < threads; t++) {
            final int start = t * chunk;
            final int end = Math.min(start + chunk, n);
            ts[t] = new Thread(() -> {
                for (int i = start; i < end; i++) {
                    total += Math.abs(a[i] - b[i]);   // race: unsynchronized shared write
                }
            });
            ts[t].start();
        }
        for (Thread t : ts) t.join();
        return total;
    }
}
