public class VectorDiff {
    public static long sumOfAbsDiff(int[] a, int[] b, int threads)
            throws InterruptedException {
        int n = a.length;
        int chunk = (n + threads - 1) / threads;
        long[] partial = new long[threads]; // each thread writes its own slot
        Thread[] ts = new Thread[threads];
        for (int t = 0; t < threads; t++) {
            final int idx = t;
            final int start = t * chunk;
            final int end = Math.min(start + chunk, n);
            ts[t] = new Thread(() -> {
                long local = 0;
                for (int i = start; i < end; i++) {
                    local += Math.abs(a[i] - b[i]);
                }
                partial[idx] = local;
            });
            ts[t].start();
        }
        for (Thread t : ts) t.join();

        long total = 0;
        for (long p : partial) {
            total += p;
        }
        return total;
    }
}
