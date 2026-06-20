---
title: Synchronization
topic: sync
order: 3
summary: Threads, race conditions, mutual exclusion, monitors, semaphores, wait/notify, and deadlock.
---

# Concurrency & Synchronization in Java

A normal program does one thing at a time: the CPU runs your statements in order. A
**concurrent** program has several independent flows of execution — **threads** — that
each run their own sequence of statements, but share the same data. That sharing is the
whole point (threads can cooperate cheaply) and also the whole problem (they can step on
each other's data). Almost everything in this guide is about one question: **how do we let
threads share data without corrupting it?**

The big mental shift from single-threaded Java is that you can no longer assume your
statements run without interruption. At almost any point, the scheduler may pause one
thread and run another. If two threads touch the same variable, the *interleaving* of
their steps decides the result — and you do not control that interleaving. Synchronization
is the set of tools that lets you take back just enough control.

## Concurrency vs parallelism

These two words are often used interchangeably, but they mean different things.

- **Concurrency** is about *structure*: several tasks are *in progress* at once. On a
  single CPU core they take turns — the scheduler runs a slice of thread A, pauses it,
  runs a slice of thread B, and so on. This rapid switching (**interleaving**) makes them
  *appear* simultaneous even though only one instruction runs at any instant.
- **Parallelism** is about *execution*: several tasks literally run *at the same instant*,
  on different CPU cores.

| | Concurrency (1 core) | Parallelism (N cores) |
|---|---|---|
| What happens | Threads interleave, taking turns | Threads run truly simultaneously |
| Looks like | Simultaneous | Is simultaneous |
| Needs sync? | **Yes** | **Yes** |

The key exam point: **both need synchronization.** With interleaving, a thread can be
paused mid-update and another thread can observe a half-finished state. With true
parallelism, two cores can write the same variable in the same instant. Either way, shared
data can be corrupted, so the protection you write is the same in both cases.

## Process vs thread

A running program is a **process**. The operating system gives each process its own
private memory (its address space). Two processes cannot accidentally read or write each
other's variables — they are isolated.

A **thread** is a flow of execution *inside* a process. A process can have many threads,
and they **share the same memory**: the same heap, the same objects, the same static
fields. Each thread has only its own *call stack* (its local variables and the chain of
method calls) and its own program counter.

| | Process | Thread |
|---|---|---|
| Memory | Private, isolated | **Shared** within the process |
| Created by OS as | Heavyweight | Lightweight |
| Communication | Pipes, sockets, files (explicit) | Just read/write shared objects |
| One crashing | Doesn't touch others | Can corrupt shared state for all |

Shared memory is exactly what makes threads powerful: passing data between them is as cheap
as a field access. It is also exactly what makes them dangerous: there is no wall stopping
two threads from writing the same field at once. **The shared heap is the source of both
the power and the danger.** Synchronization is how we put up the missing walls, selectively.

## Threads in Java

There are two classic ways to define what a thread should do.

**1. Implement `Runnable`** (preferred — your task is just a job, not an *is-a* `Thread`):

```java
class Worker implements Runnable {
    public void run() {
        System.out.println("running in " + Thread.currentThread().getName());
    }
}

Thread t = new Thread(new Worker());
t.start();
```

**2. Subclass `Thread`** (simpler to type, but ties your task to the `Thread` class):

```java
class Worker extends Thread {
    public void run() {
        System.out.println("running in " + getName());
    }
}

new Worker().start();
```

`Runnable` is generally preferred: it keeps your class free to extend something else, and
it works directly with thread pools and lambdas (`new Thread(() -> doWork())`).

### `start()` vs `run()` — a classic bug

```java
Thread t = new Thread(task);
t.run();    // BUG: runs task in the CURRENT thread, no new thread created
t.start();  // CORRECT: asks the JVM to create a new thread, which then calls run()
```

`run()` is just an ordinary method. Calling it yourself executes the body **on the calling
thread**, synchronously, like any method call. Only `start()` asks the JVM/OS to spin up a
new thread, which *then* invokes `run()` for you. If your "threads" seem to run strictly
one after another, you almost certainly called `run()` instead of `start()`.

> **Gotcha:** you may call `start()` on a given `Thread` object **once**. Calling it again
> throws `IllegalThreadStateException`. Make a new `Thread` to run the task again.

### Waiting, sleeping, and daemon threads

```java
Thread t = new Thread(task);
t.start();
t.join();            // BLOCK here until t finishes (join = "wait for it")

Thread.sleep(1000);  // pause the CURRENT thread ~1 second; does NOT release any locks
```

- **`join()`** makes the *calling* thread wait until the target thread has terminated. This
  is how `main` waits for its workers before reading their results.
- **`Thread.sleep(ms)`** pauses the thread that calls it. Note it is a `static` method — it
  always affects the current thread, never some other one. It can throw
  `InterruptedException`, so it must be caught or declared.
- A **daemon thread** is a background helper (`t.setDaemon(true)` *before* `start()`). The
  JVM exits when only daemon threads remain — it does **not** wait for them. Use daemons
  for non-essential background work; use normal (user) threads for work that must finish.

## Race conditions & atomicity

A **race condition** is when the correctness of the result depends on the timing/order in
which threads run. The textbook cause is a non-**atomic** operation. "Atomic" means
*indivisible* — it either happens completely or not at all, with no chance of another
thread observing a half-done state.

The trap: `count++` *looks* atomic but is really three steps — a **read-modify-write**:

```text
1. READ   the current value of count from memory into a register
2. MODIFY  add 1 in the register
3. WRITE  store the new value back to memory
```

Two threads can interleave between those steps and **lose an update**:

```java
class Counter {
    int value = 0;
    void increment() { value++; }   // NOT atomic!
}
```

```java
Counter c = new Counter();
Runnable job = () -> { for (int i = 0; i < 100_000; i++) c.increment(); };

Thread a = new Thread(job);
Thread b = new Thread(job);
a.start(); b.start();
a.join();  b.join();

System.out.println(c.value);   // EXPECTED 200000 — but often prints LESS
```

Why it loses updates — a bad interleaving of one `++`:

```text
Thread A: READ value (0)
Thread B: READ value (0)          <- both saw 0
Thread A: WRITE 1
Thread B: WRITE 1                 <- B overwrites A; one increment vanished
```

The final count is non-deterministic and usually below 200000. Fixing it means making the
read-modify-write **mutually exclusive** — only one thread inside at a time.

## Critical section & mutual exclusion

A **critical section** is a piece of code that accesses shared data and must not be run by
more than one thread at the same time (e.g. the body of `increment()`).

**Mutual exclusion** ("mutex") is the guarantee that **at most one thread is inside the
critical section at any moment.** Every thread that wants in must first acquire a lock;
whoever holds the lock runs the section while everyone else waits; the holder releases the
lock on the way out, and the next thread proceeds. That serialization is what eliminates
the bad interleavings above.

## Monitors and `synchronized`

Java builds mutual exclusion right into the language with the **monitor** concept: **every
object has an intrinsic lock** (also called a *monitor lock*). The `synchronized` keyword
acquires that lock on entry and releases it on exit — even if an exception is thrown.

**Synchronized method** — locks on `this` (the receiver object):

```java
class Counter {
    private int value = 0;
    synchronized void increment() { value++; }   // holds this's lock
    synchronized int get()        { return value; }
}
```

**Synchronized block** — locks on an object you name; finer-grained:

```java
class Counter {
    private int value = 0;
    private final Object lock = new Object();

    void increment() {
        synchronized (lock) {   // only this critical section is protected
            value++;
        }
    }
}
```

**Static synchronized** — there is no `this`, so it locks the **`Class` object** (one lock
shared by all instances), protecting static fields:

```java
class Registry {
    private static int total = 0;
    static synchronized void add() { total++; }   // locks Registry.class
}
```

> **Gotcha — the single most common synchronization mistake:** *all* threads that touch a
> piece of shared data must synchronize on the **same** lock. A `synchronized` *writer*
> does nothing if the *reader* reads without synchronizing, or synchronizes on a different
> object. The lock is a convention; it only works if everyone agrees to use it. Picking the
> same lock object for both reads and writes is mandatory.

Because every monitor is **reentrant**, a thread that already holds an object's lock may
enter another `synchronized` region on the *same* object without deadlocking itself.

## `java.util.concurrent` locks

The `synchronized` keyword is convenient but rigid (the lock is released exactly at the end
of the block). The `java.util.concurrent.locks` package offers explicit locks with more
control.

### `ReentrantLock`

A `ReentrantLock` does the same job as `synchronized` but you call `lock()` and `unlock()`
yourself — so you **must** release it in a `finally` block, or an exception will leak the
lock and freeze every other thread forever.

```java
import java.util.concurrent.locks.ReentrantLock;

class Counter {
    private final ReentrantLock lock = new ReentrantLock();
    private int value = 0;

    void increment() {
        lock.lock();
        try {
            value++;          // critical section
        } finally {
            lock.unlock();    // ALWAYS release, even on exception
        }
    }
}
```

Compared to `synchronized`, `ReentrantLock` adds `tryLock()` (don't block if you can't get
it), interruptible locking, and fairness options. The cost is you must remember the
`try/finally`.

### `AtomicInteger` — lock-free counters

For the simple counter case there is an even better tool. The `java.util.concurrent.atomic`
classes use a hardware **compare-and-swap (CAS)** instruction to make read-modify-write
atomic *without* any lock:

```java
import java.util.concurrent.atomic.AtomicInteger;

AtomicInteger value = new AtomicInteger(0);
value.incrementAndGet();   // atomic ++ , returns the new value
value.get();               // atomic read
```

This is **lock-free**: there is no lock to acquire, threads never block each other, yet the
increment is atomic. Prefer it for single-variable counters; reach for a lock when you must
make *several* operations atomic together.

## Counting semaphores

A **semaphore** is a counter of available **permits**. It is the right tool when you want
to allow *up to N* threads in at once, rather than exactly one.

```java
import java.util.concurrent.Semaphore;

Semaphore sem = new Semaphore(3);   // 3 permits

void useResource() throws InterruptedException {
    sem.acquire();        // take a permit; BLOCK if none are available
    try {
        // at most 3 threads run this region at the same time
        doWork();
    } finally {
        sem.release();    // give the permit back — ALWAYS, even on exception
    }
}
```

How it works:

- `acquire()` decrements the permit count; if the count is already 0, the thread blocks
  until someone releases a permit.
- `release()` increments the count and wakes a waiting thread, if any.

| Permits | Behaves like | Effect |
|---|---|---|
| `new Semaphore(1)` | **binary semaphore ≈ mutex** | mutual exclusion: one at a time |
| `new Semaphore(N)` | **counting semaphore** | caps concurrency at N threads |

> **Gotcha:** always `release()` in a `finally`. A leaked permit permanently shrinks the
> pool — after enough leaks, `acquire()` blocks forever and the system stalls. Also note a
> semaphore has no notion of ownership: any thread may release a permit, unlike a lock.

## Coordination with `wait` / `notify` / `notifyAll`

Mutual exclusion stops threads from colliding, but sometimes a thread must **wait for a
condition** that only another thread can make true — e.g. "wait until the buffer is not
empty." That is what `wait()` / `notify()` / `notifyAll()` provide. They are methods on
`Object` and they work *with* the monitor.

Rules that make them work (and break loudly if ignored):

- You may only call them **while holding the object's monitor** (inside `synchronized` on
  that object). Otherwise you get `IllegalMonitorStateException`.
- **`wait()`** atomically *releases the lock* and puts the thread to sleep. This is crucial:
  it lets *other* threads acquire the lock and change the condition. When the thread is woken
  it **re-acquires the lock** before returning from `wait()`.
- **`notify()`** wakes *one* waiting thread; **`notifyAll()`** wakes *all* of them. Waking
  does not hand over the lock — the woken thread(s) must still re-acquire it.

> **Gotcha — always wait in a `while` loop, never an `if`:** a thread can wake up without
> the condition being true (because another thread won the race, or because of a *spurious
> wakeup* allowed by the JVM). After `wait()` returns you must **re-check the condition**
> and wait again if it still does not hold. `notifyAll` is the safe default: with `notify`
> you might wake the "wrong" thread and leave a runnable one asleep.

### Producer–consumer with a bounded buffer (the canonical example)

A producer adds items; a consumer removes them. The buffer has a fixed capacity, so:
**put waits while the buffer is full; take waits while it is empty.**

```java
import java.util.LinkedList;
import java.util.Queue;

class BoundedBuffer<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;

    BoundedBuffer(int capacity) { this.capacity = capacity; }

    public synchronized void put(T item) throws InterruptedException {
        while (queue.size() == capacity) {   // WHILE, not if
            wait();                          // full: release lock, sleep
        }
        queue.add(item);
        notifyAll();                         // wake any waiting consumers
    }

    public synchronized T take() throws InterruptedException {
        while (queue.isEmpty()) {            // WHILE, not if
            wait();                          // empty: release lock, sleep
        }
        T item = queue.remove();
        notifyAll();                         // wake any waiting producers
        return item;
    }
}
```

Trace it: a consumer calls `take()` on an empty buffer, takes the lock, sees `isEmpty()`,
calls `wait()` — which *releases* the lock and sleeps. A producer can now enter `put()`,
add an item, and `notifyAll()`. The consumer wakes, **re-acquires the lock**, re-checks
the `while` (now non-empty), removes the item, and returns. The `while` loop is what makes
this correct under spurious wakeups and multiple waiters.

## Deadlock

A **deadlock** is when two or more threads are each blocked forever, each waiting for a
resource the other holds. Nobody can proceed. A deadlock requires **all four Coffman
conditions** to hold simultaneously:

| Condition | Meaning |
|---|---|
| **Mutual exclusion** | A resource is held in a non-shareable way (one holder at a time) |
| **Hold and wait** | A thread holds one resource while waiting for another |
| **No preemption** | A resource can't be forcibly taken away; only the holder releases it |
| **Circular wait** | A cycle of threads, each waiting for the next one's resource |

Break **any one** condition and deadlock becomes impossible.

### The classic two-lock, opposite-order deadlock

```java
Object lockA = new Object();
Object lockB = new Object();

// Thread 1
synchronized (lockA) {
    synchronized (lockB) { /* ... */ }   // wants B while holding A
}

// Thread 2
synchronized (lockB) {
    synchronized (lockA) { /* ... */ }   // wants A while holding B
}
```

If Thread 1 grabs `lockA` and Thread 2 grabs `lockB` at the same time, each then waits for
the lock the other holds — circular wait — and both block forever.

### Fixes

- **Consistent global lock ordering** — the standard fix. Decide a single order for all
  locks (e.g. always acquire the lock of the lower account id first) and make *every*
  thread acquire them in that order. With no cycle in the wait graph, circular wait is
  impossible.

  ```java
  Object first  = id1 < id2 ? lockA : lockB;   // always lock the lower id first
  Object second = id1 < id2 ? lockB : lockA;
  synchronized (first) {
      synchronized (second) { /* transfer */ }
  }
  ```

- **A single lock** — if one coarse lock guards everything, there is no second lock to wait
  on, so deadlock can't form. Simpler, but reduces concurrency.

> **Related hazards.** *Starvation* — a thread never gets scheduled or never wins a
> contended lock, so it makes no progress while others do. *Livelock* — threads are not
> blocked but keep reacting to each other (e.g. both repeatedly back off and retry) so no
> real work gets done. Unlike deadlock, in livelock the threads are busy; they just never
> finish.

## Practice

Tie the concepts above to the app's exercises:

- **Thread-safe counter (race)** — reproduce the lost-update bug, then fix it with
  `synchronized`, a `ReentrantLock`, or `AtomicInteger`.
- **Parallel sum of differences (reduction)** — split work across threads and combine
  partial results; practice `join()` and avoiding shared mutable state.
- **Producer–consumer bounded buffer (wait/notify)** — implement `put`/`take` with the
  `while`-loop condition checks shown above.
- **Limit concurrency with a semaphore** — use `Semaphore(N)` with `acquire()`/`release()`
  in `try/finally` to cap how many threads run a section at once.
- **Deadlock-free money transfer (lock ordering)** — transfer between accounts using a
  consistent global lock order so two opposite transfers can never deadlock.
