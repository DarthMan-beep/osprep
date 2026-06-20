public class OSPrepTest {
    public static void main(String[] args) throws Exception {
        System.out.println("1..2");

        // Test 1: no lost updates under concurrency, repeated to expose races.
        final int THREADS = 8, PER = 20000, EXPECTED = THREADS * PER;
        boolean correct = true;
        String detail = "";
        for (int run = 0; run < 10 && correct; run++) {
            Counter c = new Counter();
            Thread[] ts = new Thread[THREADS];
            for (int i = 0; i < THREADS; i++) {
                ts[i] = new Thread(() -> {
                    for (int j = 0; j < PER; j++) c.increment();
                });
                ts[i].setDaemon(true); // so a hang can't block JVM exit
                ts[i].start();
            }
            for (Thread t : ts) t.join(10000);
            int got = c.get();
            if (got != EXPECTED) {
                correct = false;
                detail = "run " + run + ": expected " + EXPECTED + " but got " + got
                        + " (lost updates — increment() is not atomic)";
            }
        }
        if (correct) {
            System.out.println("ok 1 final count equals threads*increments across repeated runs");
        } else {
            System.out.println("not ok 1 final count equals threads*increments across repeated runs");
            System.out.println("# " + detail);
        }

        // Test 2: increments are actually counted (basic sanity).
        Counter c2 = new Counter();
        for (int i = 0; i < 5; i++) c2.increment();
        if (c2.get() == 5) {
            System.out.println("ok 2 increments are counted");
        } else {
            System.out.println("not ok 2 increments are counted");
            System.out.println("# expected 5 but got " + c2.get());
        }
    }
}
