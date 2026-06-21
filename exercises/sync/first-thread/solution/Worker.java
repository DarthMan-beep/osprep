public class Worker extends Thread {
    public long result = 0;

    @Override
    public void run() {
        long sum = 0;
        for (int i = 1; i <= 100; i++) {
            sum += i;
        }
        result = sum;
    }
}
