import java.util.concurrent.atomic.AtomicInteger;

public class OSPrepTest {
    public static void main(String[] args) throws Exception {
        System.out.println("1..2");

        final int INITIAL = 1000, THREADS = 8, OPS = 50000;
        Bank bank = new Bank(2, INITIAL);
        AtomicInteger done = new AtomicInteger(0);

        // Half the threads transfer 0->1, half 1->0 — opposite lock orders in the
        // naive version, which forces the circular-wait deadlock.
        Thread[] ts = new Thread[THREADS];
        for (int t = 0; t < THREADS; t++) {
            final boolean forward = (t % 2 == 0);
            ts[t] = new Thread(() -> {
                for (int i = 0; i < OPS; i++) {
                    if (forward) bank.transfer(0, 1, 1);
                    else bank.transfer(1, 0, 1);
                }
                done.incrementAndGet();
            });
            ts[t].setDaemon(true);
        }
        long start = System.currentTimeMillis();
        for (Thread t : ts) t.start();
        while (done.get() < THREADS && System.currentTimeMillis() - start < 8000) {
            Thread.sleep(50);
        }

        boolean finished = done.get() == THREADS;
        System.out.println((finished ? "ok" : "not ok") + " 1 opposite transfers complete without deadlock");
        if (!finished)
            System.out.println("# only " + done.get() + "/" + THREADS
                    + " threads finished within 8s (circular wait from inconsistent lock order)");

        int total = bank.total();
        boolean conserved = total == 2 * INITIAL;
        System.out.println((conserved ? "ok" : "not ok") + " 2 total balance is conserved");
        if (!conserved)
            System.out.println("# expected total " + (2 * INITIAL) + " but got " + total);
    }
}
