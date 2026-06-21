public class Worker extends Thread {
    public long result = 0;

    @Override
    public void run() {
        // Pretend the work takes a moment, so timing matters.
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            // ignore
        }
        long sum = 0;
        for (int i = 1; i <= 100; i++) {
            sum += i;
        }
        result = sum;
    }
}
