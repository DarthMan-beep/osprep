public class OSPrepTest {
    public static void main(String[] args) throws Exception {
        System.out.println("1..2");

        // Test 1: the thread computes the right sum.
        Worker w = new Worker();
        w.start();
        w.join();
        System.out.println((w.result == 5050 ? "ok" : "not ok")
                + " 1 run() computes 1..100 into result (5050)");
        if (w.result != 5050) System.out.println("# expected 5050 but got " + w.result);

        // Test 2: the work really happens inside run() (result starts at 0).
        Worker w2 = new Worker();
        long before = w2.result;
        w2.start();
        w2.join();
        System.out.println((before == 0 && w2.result == 5050 ? "ok" : "not ok")
                + " 2 the work happens inside run(), not before it");
        if (before != 0) System.out.println("# result was " + before + " before the thread ran");
    }
}
