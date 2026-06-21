# Start a thread and wait for it

The previous exercise wrote a thread's `run()`. Now you do the other side: **start** the
thread and **wait** for it to finish.

A ready-made `Worker` is provided (read it in *Provided files* below). Its `run()` sleeps
briefly, then computes the sum `1..100` into `result`. The sleep matters: if you read
`result` too early, the thread isn't done yet and you'll see `0`.

## Task

Complete **`Launcher.computeWithThread()`** so it:

1. **starts** the worker on a new thread, then
2. **waits** for it to finish, then
3. returns `w.result`.

```java
public class Launcher {
    public static long computeWithThread() throws InterruptedException {
        Worker w = new Worker();
        // start it, wait for it, then return w.result
        return w.result;
    }
}
```

The grader calls `computeWithThread()` and expects **5050**.

> **Hints:** `w.start()` launches `run()` on a new thread and returns *immediately* — it
> does **not** wait. To wait until the thread has finished, call `w.join()`. So the order
> is: `start()`, then `join()`, then read `result`. Try removing the `join()` mentally —
> you'd return `0` because the worker is still sleeping. (Never call `w.run()` directly;
> that would run it on the *current* thread, not a new one.)
