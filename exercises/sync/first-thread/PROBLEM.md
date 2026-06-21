# Your first thread

A **thread** is a separate flow of execution that runs *alongside* your main program. In
Java, the simplest way to make one is to extend the `Thread` class and put the work you
want done inside its **`run()`** method.

You don't call `run()` yourself — instead, someone calls **`start()`** on the object, and
Java runs your `run()` on a brand-new thread. When the work needs to be waited for, they
call **`join()`**.

## Task

`Worker` extends `Thread`. Fill in its **`run()`** method so that it computes the sum
`1 + 2 + … + 100` and stores the total in the field **`result`**.

```java
public class Worker extends Thread {
    public long result = 0;

    @Override
    public void run() {
        // your code here
    }
}
```

The grader does this and expects `result` to be `5050`:

```java
Worker w = new Worker();
w.start();   // runs your run() on a new thread
w.join();    // wait for it to finish
// w.result must now be 5050
```

> **Hints:** this is just a normal loop — `for (int i = 1; i <= 100; i++) sum += i;` —
> the only twist is that it lives inside `run()`, and you store the answer in `result`
> (not `return` it; `run()` returns nothing).
