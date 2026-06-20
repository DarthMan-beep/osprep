import java.util.Random;

public class OSPrepTest {
    static long reference(int[] a, int[] b) {
        long s = 0;
        for (int i = 0; i < a.length; i++) s += Math.abs((long) a[i] - b[i]);
        return s;
    }

    static int[] randArray(Random r, int n) {
        int[] x = new int[n];
        for (int i = 0; i < n; i++) x[i] = r.nextInt(1000);
        return x;
    }

    public static void main(String[] args) throws Exception {
        System.out.println("1..3");
        Random r = new Random(42);

        // Test 1: large array, 4 threads, repeated — exposes the shared-write race.
        boolean ok1 = true;
        String d1 = "";
        for (int run = 0; run < 6 && ok1; run++) {
            int n = 1_000_000;
            int[] a = randArray(r, n), b = randArray(r, n);
            long exp = reference(a, b);
            long got = VectorDiff.sumOfAbsDiff(a, b, 4);
            if (got != exp) { ok1 = false; d1 = "run " + run + ": expected " + exp + " but got " + got; }
        }
        System.out.println((ok1 ? "ok" : "not ok") + " 1 correct sum with 4 threads across repeated runs");
        if (!ok1) System.out.println("# " + d1 + " (lost updates on the shared total)");

        // Test 2: length not divisible by thread count (chunk-boundary correctness).
        int n2 = 999983;
        int[] a2 = randArray(r, n2), b2 = randArray(r, n2);
        long exp2 = reference(a2, b2);
        long got2 = VectorDiff.sumOfAbsDiff(a2, b2, 7);
        System.out.println((got2 == exp2 ? "ok" : "not ok") + " 2 correct when length is not divisible by thread count");
        if (got2 != exp2) System.out.println("# expected " + exp2 + " but got " + got2);

        // Test 3: single thread.
        long got3 = VectorDiff.sumOfAbsDiff(a2, b2, 1);
        System.out.println((got3 == exp2 ? "ok" : "not ok") + " 3 correct with a single thread");
        if (got3 != exp2) System.out.println("# expected " + exp2 + " but got " + got3);
    }
}
