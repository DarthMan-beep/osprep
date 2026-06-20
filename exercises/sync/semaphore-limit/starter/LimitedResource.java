public class LimitedResource {
    public static final int LIMIT = 3;

    public void access(Runnable work) throws InterruptedException {
        work.run();   // BUG: no limit — every thread runs concurrently
    }
}
