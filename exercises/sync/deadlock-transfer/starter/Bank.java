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
        // BUG: locks in argument order -> opposite transfers deadlock.
        synchronized (lock[from]) {
            synchronized (lock[to]) {
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
