public class Launcher {
    public static long computeWithThread() throws InterruptedException {
        Worker w = new Worker();
        // TODO: start the worker, wait for it to finish, then return its result.
        // (Return too early and result is still 0!)
        return w.result;
    }
}
