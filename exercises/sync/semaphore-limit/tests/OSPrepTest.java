import java.util.concurrent.atomic.AtomicInteger;

public class OSPrepTest {
    public static void main(String[] args) throws Exception {
        System.out.println("1..2");

        final int THREADS = 30;
        LimitedResource r = new LimitedResource();
        AtomicInteger current = new AtomicInteger(0);
        AtomicInteger maxSeen = new AtomicInteger(0);
        AtomicInteger completed = new AtomicInteger(0);

        Runnable work = () -> {
            int now = current.incrementAndGet();
            maxSeen.accumulateAndGet(now, Math::max);
            try { Thread.sleep(20); } catch (InterruptedException e) { /* ignore */ }
            current.decrementAndGet();
            completed.incrementAndGet();
        };

        Thread[] ts = new Thread[THREADS];
        for (int i = 0; i < THREADS; i++) {
            ts[i] = new Thread(() -> {
                try { r.access(work); } catch (InterruptedException e) { /* ignore */ }
            });
            ts[i].setDaemon(true);
            ts[i].start();
        }
        for (Thread t : ts) t.join(15000);

        boolean capped = maxSeen.get() <= LimitedResource.LIMIT;
        System.out.println((capped ? "ok" : "not ok") + " 1 at most LIMIT threads run concurrently");
        if (!capped)
            System.out.println("# observed " + maxSeen.get() + " concurrent, limit is " + LimitedResource.LIMIT);

        boolean all = completed.get() == THREADS;
        System.out.println((all ? "ok" : "not ok") + " 2 all threads eventually complete (no deadlock/starvation)");
        if (!all)
            System.out.println("# only " + completed.get() + "/" + THREADS + " completed");
    }
}
