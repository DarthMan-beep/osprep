import java.util.LinkedList;
import java.util.Queue;

public class BoundedBuffer {
    private final Queue<Integer> q = new LinkedList<>();
    private final int capacity;

    public BoundedBuffer(int capacity) {
        this.capacity = capacity;
    }

    public synchronized void put(int item) throws InterruptedException {
        while (q.size() == capacity) {
            wait();                 // block while full
        }
        q.add(item);
        notifyAll();                // wake any waiting takers
    }

    public synchronized int take() throws InterruptedException {
        while (q.isEmpty()) {
            wait();                 // block while empty
        }
        int item = q.poll();
        notifyAll();                // wake any waiting putters
        return item;
    }
}
