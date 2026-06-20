import java.util.LinkedList;
import java.util.Queue;

public class BoundedBuffer {
    private final Queue<Integer> q = new LinkedList<>();
    private final int capacity;

    public BoundedBuffer(int capacity) {
        this.capacity = capacity;
    }

    public void put(int item) throws InterruptedException {
        if (q.size() < capacity) {
            q.add(item);          // BUG: when full, the item is silently dropped
        }
        // BUG: no locking, no waiting
    }

    public int take() throws InterruptedException {
        if (!q.isEmpty()) {
            return q.poll();
        }
        return -2;                // BUG: nothing to take — should block instead
    }
}
