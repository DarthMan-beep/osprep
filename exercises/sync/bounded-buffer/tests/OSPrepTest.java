import java.util.concurrent.ConcurrentHashMap;

public class OSPrepTest {
    public static void main(String[] args) throws Exception {
        System.out.println("1..2");

        // ---- Test 1: every item delivered exactly once, under concurrency ----
        final int CAP = 5, PRODUCERS = 4, PER = 5000, TOTAL = PRODUCERS * PER, CONSUMERS = 3;
        final int POISON = -1;
        BoundedBuffer buf = new BoundedBuffer(CAP);
        ConcurrentHashMap<Integer, Integer> seen = new ConcurrentHashMap<>();

        Thread[] prod = new Thread[PRODUCERS];
        for (int p = 0; p < PRODUCERS; p++) {
            final int base = p * PER;
            prod[p] = new Thread(() -> {
                try {
                    for (int i = 0; i < PER; i++) buf.put(base + i);
                } catch (InterruptedException e) { /* ignore */ }
            });
            prod[p].setDaemon(true);
        }
        Thread[] cons = new Thread[CONSUMERS];
        for (int c = 0; c < CONSUMERS; c++) {
            cons[c] = new Thread(() -> {
                try {
                    while (true) {
                        int v = buf.take();
                        if (v == POISON) break;
                        seen.merge(v, 1, Integer::sum);
                    }
                } catch (InterruptedException e) { /* ignore */ }
            });
            cons[c].setDaemon(true);
        }
        for (Thread t : prod) t.start();
        for (Thread t : cons) t.start();
        for (Thread t : prod) t.join(15000);
        for (int i = 0; i < CONSUMERS; i++) buf.put(POISON); // unblock + stop consumers
        for (Thread t : cons) t.join(15000);

        boolean exactlyOnce = seen.size() == TOTAL;
        if (exactlyOnce) {
            for (int v = 0; v < TOTAL; v++) {
                Integer cnt = seen.get(v);
                if (cnt == null || cnt != 1) { exactlyOnce = false; break; }
            }
        }
        System.out.println((exactlyOnce ? "ok" : "not ok") + " 1 every item is delivered exactly once");
        if (!exactlyOnce)
            System.out.println("# expected " + TOTAL + " unique items, got " + seen.size() + " distinct");

        // ---- Test 2: put() blocks when the buffer is full ----
        BoundedBuffer b2 = new BoundedBuffer(2);
        Thread filler = new Thread(() -> {
            try {
                for (int i = 0; i < 5; i++) b2.put(i);
            } catch (InterruptedException e) { /* ignore */ }
        });
        filler.setDaemon(true);
        filler.start();
        Thread.sleep(400);
        boolean blocked = filler.isAlive();
        System.out.println((blocked ? "ok" : "not ok") + " 2 put() blocks when the buffer is full");
        if (!blocked)
            System.out.println("# filler put all 5 items into a capacity-2 buffer without blocking");
    }
}
