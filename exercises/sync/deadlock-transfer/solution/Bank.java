public class Bank {
    private final int[] balance;
    private final Object[] lock;

    public Bank(int n, int initial) {
        balance = new int[n];
        lock = new Object[n];
        for (int i = 0; i < n; i++) {
            balance[i] = initial;
            lock[i] = new Object();
        }
    }

    public void transfer(int from, int to, int amount) {
        // Always acquire the lower-indexed lock first -> no circular wait, no deadlock.
        int first = Math.min(from, to);
        int second = Math.max(from, to);
        synchronized (lock[first]) {
            synchronized (lock[second]) {
                balance[from] -= amount;
                balance[to] += amount;
            }
        }
    }

    public int total() {
        int sum = 0;
        for (int b : balance) sum += b;
        return sum;
    }
}
