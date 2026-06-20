public class Counter {
    private int value = 0;

    public void increment() {
        value++;   // TODO: make this safe for concurrent threads
    }

    public int get() {
        return value;
    }
}
