public class Launcher {
    public static long computeWithTwoThreads() throws InterruptedException {
        RangeWorker a = new RangeWorker(1, 50);
        RangeWorker b = new RangeWorker(51, 100);
        // TODO: start BOTH threads, wait for BOTH to finish,
        //       then return a.result + b.result
        return 0;
    }
}
