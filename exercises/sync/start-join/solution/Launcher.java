public class Launcher {
    public static long computeWithThread() throws InterruptedException {
        Worker w = new Worker();
        w.start();
        w.join();
        return w.result;
    }
}
