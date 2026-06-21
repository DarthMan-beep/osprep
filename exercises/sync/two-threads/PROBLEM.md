# Two threads working together

This is the core idea behind parallelism: **split the work**, run the pieces on separate
threads **at the same time**, then **combine** the results.

A `RangeWorker` is provided (see *Provided files*). You give it a range `[from, to]`; its
`run()` sleeps a moment, then sums that range into `result`.

## Task

Complete **`Launcher.computeWithTwoThreads()`** so it sums `1..100` using **two** threads:

- one worker handles `1..50`, the other handles `51..100`,
- both run **in parallel**,
- after both finish, return the **combined** total (which is `5050`).

```java
public class Launcher {
    public static long computeWithTwoThreads() throws InterruptedException {
        RangeWorker a = new RangeWorker(1, 50);
        RangeWorker b = new RangeWorker(51, 100);
        // start both, wait for both, then return a.result + b.result
        return 0;
    }
}
```

> **Hints:** to get real parallelism, **start both** threads first (`a.start(); b.start();`),
> and only then **wait for both** (`a.join(); b.join();`). If you instead do
> `a.start(); a.join(); b.start(); b.join();` you'd get the right number but run them one
> after another — start-both-then-join-both lets them work simultaneously. Finally return
> `a.result + b.result`.
