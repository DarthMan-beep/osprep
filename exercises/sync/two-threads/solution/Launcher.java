public class Launcher {
    public static long computeWithTwoThreads() throws InterruptedException {
        RangeWorker a = new RangeWorker(1, 50);
        RangeWorker b = new RangeWorker(51, 100);
        a.start();
        b.start();
        a.join();
        b.join();
        return a.result + b.result;
    }
}
