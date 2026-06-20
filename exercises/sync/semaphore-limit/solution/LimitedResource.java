import java.util.concurrent.Semaphore;

public class LimitedResource {
    public static final int LIMIT = 3;

    private final Semaphore sem = new Semaphore(LIMIT);

    public void access(Runnable work) throws InterruptedException {
        sem.acquire();
        try {
            work.run();
        } finally {
            sem.release();
        }
    }
}
