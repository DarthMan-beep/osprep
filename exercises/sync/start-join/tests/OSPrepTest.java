public class OSPrepTest {
    public static void main(String[] args) throws Exception {
        System.out.println("1..1");
        long r = Launcher.computeWithThread();
        System.out.println((r == 5050 ? "ok" : "not ok")
                + " 1 starts the thread and waits (join) before returning");
        if (r != 5050) {
            System.out.println("# got " + r + " — did you start() AND join() the worker?");
        }
    }
}
