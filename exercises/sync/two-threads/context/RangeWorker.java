public class RangeWorker extends Thread {
    private final int from;
    private final int to;
    public long result = 0;

    public RangeWorker(int from, int to) {
        this.from = from;
        this.to = to;
    }

    @Override
    public void run() {
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            // ignore
        }
        long sum = 0;
        for (int i = from; i <= to; i++) {
            sum += i;
        }
        result = sum;
    }
}
