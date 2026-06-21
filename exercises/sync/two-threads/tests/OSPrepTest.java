public class OSPrepTest {
    public static void main(String[] args) throws Exception {
        System.out.println("1..1");
        long r = Launcher.computeWithTwoThreads();
        System.out.println((r == 5050 ? "ok" : "not ok")
                + " 1 two threads each sum half, combined into 5050");
        if (r != 5050) {
            System.out.println("# got " + r + " — start both, join both, then add a.result + b.result");
        }
    }
}
